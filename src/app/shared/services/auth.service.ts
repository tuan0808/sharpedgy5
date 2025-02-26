import {computed, effect, inject, Injectable, Signal, signal} from '@angular/core';
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signOut,
    User,
    onAuthStateChanged,
    Auth, browserLocalPersistence, signInWithPopup
} from "@angular/fire/auth";
import { setPersistence } from 'firebase/auth';
import { Router } from "@angular/router";
import {LoginMetrics} from "../model/auth/LoginMetrics";
import {environment} from "../../../environments/environment";
import {PartialUser} from "../model/auth/PartialUser";
import {HttpClient} from "@angular/common/http";
import {UserService} from "./user.service";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly SESSION_DURATION = 24 * 60 * 60 * 1000;
    private readonly MAX_LOGIN_ATTEMPTS = 3;
    private readonly LOCKOUT_DURATION = 15 * 60 * 1000;
    private redirectUrl: string | null = null;

    // Dependency injection
    private readonly userService : UserService = inject(UserService)
    private readonly router = inject(Router);
    readonly auth = inject(Auth);
    private readonly http : HttpClient = inject(HttpClient)

    // State management with Signals
    private readonly user = signal<User | null>(null);
    private readonly authInitialized = signal<boolean>(false);
    private readonly loginMetrics = signal<LoginMetrics>({
        attempts: 0,
        lastAttempt: 0
    });

    // Public reactive properties
    readonly isAuthenticated: Signal<boolean> = computed(() => !!this.user());
    readonly displayName: Signal<string> = computed(() =>
        this.user()?.displayName || this.user()?.email || 'Guest'
    );

    private sessionTimeout?: number;

    constructor() {
        // Effects for session timeout and CSRF protection
        effect(() => {
            const user = this.user();
            if (user) {
                if (this.sessionTimeout) {
                    clearTimeout(this.sessionTimeout);
                }
                this.sessionTimeout = window.setTimeout(() => {
                    this.logout();
                    this.logSecurityEvent('session_timeout', { uid: user.uid });
                }, this.SESSION_DURATION);
            }
        });

        effect(() => {
            if (this.user()) {
                const expectedState = sessionStorage.getItem('auth_state');
                const actualState = new URLSearchParams(window.location.search).get('state');
                if (expectedState && actualState && expectedState !== actualState) {
                    this.logout();
                    this.logSecurityEvent('csrf_attack_prevented');
                }
            }
        });
    }

    // Lazy initialize auth when needed
    async ensureAuthInitialized(): Promise<void> {
        if (this.authInitialized()) return;
        try {
            await setPersistence(this.auth, browserLocalPersistence);
            await new Promise<void>(resolve => {
                console.log('hiiiii');
                onAuthStateChanged(this.auth, async (user) => {
                    this.user.set(user);
                    this.authInitialized.set(true);
                    resolve();
                });
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.authInitialized.set(true); // Mark as initialized even on error
        }
    }

    checkIfNewUser(creationTime: string, lastSignInTime: string): boolean {
        return creationTime === lastSignInTime;
    }


    // Public method to get UID
    async getUID(): Promise<string | null> {
        await this.ensureAuthInitialized();
        return this.user()?.uid ?? null;
    }



    // Login methods
    async loginWithEmail(email: string, password: string): Promise<User> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) {
            throw new Error('Account temporarily locked due to too many attempts');
        }
        try {
            const credential = await signInWithEmailAndPassword(this.auth, email, password);
            this.resetLoginMetrics();
            this.logSecurityEvent('email_login_success', { uid: credential.user.uid });
            await this.registerAccount(credential.user).then(s=>s)
            return credential.user;
        } catch (error) {
            this.handleFailedLogin(email);
            this.logSecurityEvent('email_login_failed', { error: (error as Error).message });
            throw error;
        }
    }



    async loginWithGoogle(): Promise<User> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) {
            throw new Error('Account temporarily locked due to too many attempts');
        }
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('email profile');
            const credential = await signInWithPopup(this.auth, provider);
            this.resetLoginMetrics();
            this.logSecurityEvent('google_login_success', {
                uid: credential.user.uid,
                email: credential.user.email
            });
            // Call registerAccount but don't await it here
            this.registerAccount(credential.user).catch(error => {
                console.error('Failed to register user after login:', error);
                // Optionally log this to your security event system
                this.logSecurityEvent('post_login_registration_failed', { error: error.message });
            });
            return credential.user; // Return immediately after successful login
        } catch (error) {
            this.handleFailedLogin('google-auth');
            this.logSecurityEvent('google_login_failed', { error: (error as Error).message });
            throw error;
        }
    }

    async registerAccount(user: User): Promise<Boolean> {
        const isNew = this.checkIfNewUser(user.metadata.creationTime, user.metadata.lastSignInTime);
        console.log(`Is new? ${isNew}, Creation: ${user.metadata.creationTime}, LastSignIn: ${user.metadata.lastSignInTime}`);

        if (true) {
            await this.userService.createUser({
                uid: user.uid,
                displayName: user.displayName,
            });
            console.log('createUser called');
        }
        return true;
    }

    // Logout
    async logout(): Promise<void> {
        try {
            const user = this.user();
            await signOut(this.auth);
            this.user.set(null);
            await this.router.navigate(['/auth/login']);
            this.logSecurityEvent('logout_success', { uid: user?.uid });
        } catch (error) {
            this.logSecurityEvent('logout_error', { error: (error as Error).message });
            throw error;
        }
    }

    // Navigation to login form
    async showLoginForm(): Promise<void> {
        const currentUrl = this.router.url;
        this.setRedirectUrl(currentUrl);
        await this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: currentUrl }
        });
    }

    setRedirectUrl(url: string): void {
        this.redirectUrl = url;
    }

    getRedirectUrl(): string | null {
        return this.redirectUrl;
    }

    private generateStateParam(): string {
        const state = crypto.randomUUID();
        sessionStorage.setItem('auth_state', state);
        return state;
    }

    // Login metrics and security
    private isLocked(): boolean {
        const metrics = this.loginMetrics();
        return metrics.lockoutUntil !== undefined && Date.now() < metrics.lockoutUntil;
    }

    private handleFailedLogin(email: string): void {
        const metrics = this.loginMetrics();
        const attempts = metrics.attempts + 1;
        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
            this.loginMetrics.set({
                attempts: 0,
                lastAttempt: Date.now(),
                lockoutUntil: Date.now() + this.LOCKOUT_DURATION
            });
        } else {
            this.loginMetrics.set({
                ...metrics,
                attempts,
                lastAttempt: Date.now()
            });
        }
    }

    private resetLoginMetrics(): void {
        this.loginMetrics.set({
            attempts: 0,
            lastAttempt: Date.now()
        });
    }

    private logSecurityEvent(event: string, data?: Record<string, any>): void {
        if (environment.production) {
            console.info(`Security Event: ${event}`, data);
        } else {
            console.debug(`Security Event: ${event}`, data);
        }
    }
}

import {computed, effect, Injectable, signal} from '@angular/core';
import {
    signInWithEmailAndPassword,
    signInWithRedirect,
    GoogleAuthProvider,
    signOut,
    User,
    onAuthStateChanged,
    getRedirectResult,
    getAuth, Auth
} from "@angular/fire/auth";
import { browserLocalPersistence,browserSessionPersistence, setPersistence } from 'firebase/auth';
import { Router } from "@angular/router";
import {LoginMetrics} from "../model/auth/LoginMetrics";
import {environment} from "../../../environments/environment";
import {AuthErrorDetail} from "../model/auth/AuthErrorDetail";
import {AuthCache} from "../model/auth/AuthCache";
import {BehaviorSubject, firstValueFrom} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    private readonly MAX_LOGIN_ATTEMPTS = 3;
    private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    private readonly RETRY_ATTEMPTS = 3;
    private readonly RETRY_DELAY = 1000;

    private authInitialized = new BehaviorSubject<boolean>(false);
    private authCheckComplete = signal<boolean>(false);
    readonly authState = signal<User | null>(null);
    readonly isAuthenticated = computed(() => this.authCheckComplete() && !!this.authState());
    readonly displayName = computed(() =>
        this.authState()?.displayName ||
        this.authState()?.email ||
        'Guest'
    );

    private loginMetrics = signal<LoginMetrics>({
        attempts: 0,
        lastAttempt: 0
    });

    private returnUrl = signal<string | null>(null);
    private sessionTimeout?: number;
    private unsubscribeAuth?: () => void;

    constructor(
        private router: Router,
        private readonly auth: Auth
    ) {
        this.initAuth();
        this.setupSessionTimeout();
        this.setupCSRFProtection();
    }

    private async initAuth() {
        try {
            // Use session persistence instead of local
            await setPersistence(this.auth, browserSessionPersistence);

            // Clear any existing subscriptions
            if (this.unsubscribeAuth) {
                this.unsubscribeAuth();
            }

            return new Promise<void>((resolve) => {
                this.unsubscribeAuth = onAuthStateChanged(this.auth, async (user) => {
                    console.debug('Auth state changed:', user?.uid);

                    // Update auth state
                    this.authState.set(user);
                    this.authCheckComplete.set(true);

                    if (!user) {
                        this.logSecurityEvent('user_signed_out');
                        if (this.authInitialized.value) {
                            // Only navigate if we're already initialized (avoid initial redirect)
                            await this.router.navigate(['/login']);
                        }
                    } else {
                        this.logSecurityEvent('auth_state_changed', { uid: user.uid });
                        const savedReturnUrl = this.returnUrl();
                        if (savedReturnUrl) {
                            this.returnUrl.set(null);
                            await this.router.navigate([savedReturnUrl]);
                        }
                    }

                    // Mark as initialized after first auth state check
                    if (!this.authInitialized.value) {
                        this.authInitialized.next(true);
                        resolve();
                    }
                }, (error) => {
                    console.error('Auth state change error:', error);
                    this.authInitialized.next(true);
                    this.authCheckComplete.set(true);
                    resolve();
                });
            });

        } catch (error) {
            this.logSecurityEvent('init_auth_error', { error: (error as Error).message });
            this.authInitialized.next(true);
            this.authCheckComplete.set(true);
            throw error;
        }
    }

    async reinitializeAuth() {
        this.authCheckComplete.set(false);
        this.authInitialized.next(false);
        await this.initAuth();
    }

    private async handleRedirectResult(retries = this.RETRY_ATTEMPTS): Promise<User | null> {
        try {
            const result = await getRedirectResult(this.auth);
            return result?.user || null;
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                return this.handleRedirectResult(retries - 1);
            }
            this.logSecurityEvent('redirect_result_error', { error: (error as Error).message });
            throw error;
        }
    }

    async loginWithGoogle() {
        try {
            await this.waitForAuthInit();
            this.returnUrl.set(this.router.url);
            const provider = new GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            provider.setCustomParameters({
                state: this.generateStateParam()
            });

            await signInWithRedirect(this.auth, provider);
            this.logSecurityEvent('google_login_initiated');
        } catch (error) {
            this.logSecurityEvent('google_login_error', { error: (error as Error).message });
            throw error;
        }
    }

    async loginWithEmail(email: string, password: string) {
        await this.waitForAuthInit();

        if (this.isLocked()) {
            const error = new Error('Account temporarily locked');
            this.logSecurityEvent('login_blocked_lockout', { email });
            throw error;
        }

        try {
            const { user } = await signInWithEmailAndPassword(this.auth, email, password);
            this.resetLoginMetrics();
            this.logSecurityEvent('email_login_success', { email });
            const savedReturnUrl = this.returnUrl() || '/';
            this.returnUrl.set(null);
            await this.router.navigate([savedReturnUrl]);
            return user;
        } catch (error) {
            const authError = error as AuthErrorDetail;
            this.handleFailedLogin(email);
            this.logSecurityEvent('email_login_error', {
                email,
                code: authError.code,
                attempts: this.loginMetrics().attempts
            });
            throw authError;
        }
    }

    async logout() {
        await this.waitForAuthInit();
        try {
            const user = this.auth.currentUser;
            await signOut(this.auth);

            // Explicitly clear state
            this.authState.set(null);
            this.clearSessionTimeout();

            // Force a reinitialization of auth
            await this.reinitializeAuth();

            await this.router.navigate(['/login']);
            this.logSecurityEvent('logout_success', { uid: user?.uid });
        } catch (error) {
            this.logSecurityEvent('logout_error', { error: (error as Error).message });
            throw error;
        }
    }

    async getUID(): Promise<string | null> {
        await this.waitForAuthInit();
        // Double-check auth state is complete
        if (!this.authCheckComplete()) {
            await this.reinitializeAuth();
        }
        const uid = this.auth.currentUser?.uid ?? null;
        console.debug('getUID called, returning:', uid);
        return uid;
    }

    private async waitForAuthInit(): Promise<void> {
        if (!this.authInitialized.value) {
            await firstValueFrom(this.authInitialized.asObservable());
        }
    }

    private setupSessionTimeout() {
        effect(() => {
            const user = this.authState();
            if (user) {
                this.clearSessionTimeout();
                this.sessionTimeout = window.setTimeout(() => {
                    this.logout();
                    this.logSecurityEvent('session_timeout', { uid: user.uid });
                }, this.SESSION_DURATION);
            }
        });
    }

    private clearSessionTimeout() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }
    }

    private setupCSRFProtection() {
        effect(() => {
            if (this.authState()) {
                const expectedState = sessionStorage.getItem('auth_state');
                const actualState = new URLSearchParams(window.location.search).get('state');

                if (expectedState && actualState && expectedState !== actualState) {
                    this.logout();
                    this.logSecurityEvent('csrf_attack_prevented');
                }
            }
        });
    }

    private generateStateParam(): string {
        const state = crypto.randomUUID();
        sessionStorage.setItem('auth_state', state);
        return state;
    }

    private isLocked(): boolean {
        const metrics = this.loginMetrics();
        return metrics.lockoutUntil !== undefined &&
            Date.now() < metrics.lockoutUntil;
    }

    private handleFailedLogin(email: string) {
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

    private resetLoginMetrics() {
        this.loginMetrics.set({
            attempts: 0,
            lastAttempt: Date.now()
        });
    }

    private logSecurityEvent(event: string, data?: Record<string, any>) {
        if (environment.production) {
            // Implement production logging service integration
            console.info(`Security Event: ${event}`, data);
        } else {
            console.debug(`Security Event: ${event}`, data);
        }
    }
}

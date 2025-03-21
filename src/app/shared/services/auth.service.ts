import { computed, effect, inject, Injectable, Signal, signal } from '@angular/core';
import {
    signInWithEmailAndPassword, GoogleAuthProvider, signOut, User, onAuthStateChanged, Auth, browserLocalPersistence,
    signInWithPopup, FacebookAuthProvider, OAuthProvider, TwitterAuthProvider, getIdTokenResult, onIdTokenChanged
} from "@angular/fire/auth";
import { setPersistence } from 'firebase/auth';
import { Router } from "@angular/router";
import { LoginMetrics } from "../model/auth/LoginMetrics";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { UserService } from "./user.service";
import {firstValueFrom, throwError, timeout} from "rxjs";
import {catchError} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly SESSION_DURATION = 24 * 60 * 60 * 1000;
    private readonly MAX_LOGIN_ATTEMPTS = 3;
    private readonly LOCKOUT_DURATION = 15 * 60 * 1000;
    private redirectUrl: string | null = null;
    private readonly userService: UserService = inject(UserService);
    private readonly router = inject(Router);
    readonly auth = inject(Auth);
    private readonly http: HttpClient = inject(HttpClient);

    private readonly user = signal<User | null>(null);
    private readonly authInitialized = signal<boolean>(false);
    private readonly loginMetrics = signal<LoginMetrics>(this.loadLoginMetrics());
    private cachedToken: { token: string, expiresAt: number } | null = null; // Token cache

    readonly isAuthenticated: Signal<boolean> = computed(() => !!this.user());
    readonly displayName: Signal<string> = computed(() =>
        this.user()?.displayName || this.user()?.email || 'Guest'
    );

    private readonly isAdminSignal = signal<boolean>(false);
    readonly isAdmin: Signal<boolean> = computed(() => this.isAdminSignal());

    private sessionTimeout?: number;

    constructor() {
        effect(() => {
            const user = this.user();
            if (user) {
                if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
                this.sessionTimeout = window.setTimeout(() => {
                    this.logout();
                    this.logSecurityEvent('session_timeout', { uid: user.uid });
                }, this.SESSION_DURATION);
                this.checkAdminStatus(user);
            } else {
                this.isAdminSignal.set(false);
            }
        }, { allowSignalWrites: true });

        onIdTokenChanged(this.auth, async (user) => {
            this.user.set(user);
            if (user) {
                const token = await this.getFreshToken(); // Use cached token if valid
                console.log("Token from onIdTokenChanged:", token);
                this.updateBackendToken(token);
            }
        });
    }

    async ensureAuthInitialized(): Promise<void> {
        if (this.authInitialized()) return;
        try {
            await setPersistence(this.auth, browserLocalPersistence);
            await new Promise<void>(resolve => {
                onAuthStateChanged(this.auth, async (user) => {
                    this.user.set(user);
                    this.authInitialized.set(true);
                    resolve();
                });
            });
        } catch (error) {
            this.logSecurityEvent('auth_init_error', { message: 'Initialization failed' });
            this.authInitialized.set(true);
        }
    }

    private async checkAdminStatus(user: User): Promise<void> {
        try {
            const tokenResult = await getIdTokenResult(user);
            const isAdmin = tokenResult.claims['isAdmin'] === true;
            this.isAdminSignal.set(isAdmin);
        } catch (error) {
            this.isAdminSignal.set(false);
            this.logSecurityEvent('admin_check_failed', { message: 'Failed to verify admin status' });
        }
    }

    private loadLoginMetrics(): LoginMetrics {
        const stored = localStorage.getItem('login_metrics');
        return stored ? JSON.parse(stored) : { attempts: 0, lastAttempt: 0 };
    }

    private saveLoginMetrics(metrics: LoginMetrics): void {
        localStorage.setItem('login_metrics', JSON.stringify(metrics));
        this.loginMetrics.set(metrics);
    }

    checkIfNewUser(creationTime: string, lastSignInTime: string): boolean {
        return creationTime === lastSignInTime;
    }

    async getUID(): Promise<string | null> {
        await this.ensureAuthInitialized();
        return this.user()?.uid ?? null;
    }

    async getFreshToken(forceRefresh = false): Promise<string | null> {
        await this.ensureAuthInitialized();
        const user = this.auth.currentUser;
        if (!user) {
            console.error("No user logged in");
            return null;
        }

        const now = Date.now() / 1000; // Current time in seconds

        // If we have a cached token and not forcing refresh, use it
        if (!forceRefresh && this.cachedToken && this.cachedToken.expiresAt > now + 300) { // 5-min buffer
            console.log("Using cached token, expires in:", Math.round(this.cachedToken.expiresAt - now), "seconds");
            return this.cachedToken.token;
        }

        try {
            console.log("Fetching fresh token...");
            const token = await user.getIdToken(true); // Force refresh
            const decoded = JSON.parse(atob(token.split('.')[1]));

            this.cachedToken = { token, expiresAt: decoded.exp };
            console.log("Fresh token acquired, expires at:", new Date(decoded.exp * 1000));

            // Make sure the token is also refreshed on the backend
            await this.updateBackendToken(token);

            return token;
        } catch (error) {
            console.error("Error fetching fresh token:", error);
            return null;
        }
    }

    async loginWithEmail(email: string, password: string): Promise<User> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const credential = await signInWithEmailAndPassword(this.auth, email, password);
            this.resetLoginMetrics();
            this.logSecurityEvent('email_login_success', { uid: credential.user.uid });
            await this.registerAccount(credential.user);
            return credential.user;
        } catch (error) {
            this.handleFailedLogin(email);
            this.logSecurityEvent('email_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    async loginWithGoogle(): Promise<User> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('email profile');
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });
            const credential = await signInWithPopup(this.auth, provider);
            if (!this.validateState(state)) throw new Error('Invalid state parameter');
            this.resetLoginMetrics();
            this.logSecurityEvent('google_login_success', { uid: credential.user.uid });
            await this.registerAccount(credential.user);
            return credential.user;
        } catch (error) {
            this.handleFailedLogin('google-auth');
            this.logSecurityEvent('google_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    async loginWithFacebook(): Promise<User> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new FacebookAuthProvider();
            provider.addScope('email');
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });
            const credential = await signInWithPopup(this.auth, provider);
            if (!this.validateState(state)) throw new Error('Invalid state parameter');
            this.resetLoginMetrics();
            this.logSecurityEvent('facebook_login_success', { uid: credential.user.uid });
            await this.registerAccount(credential.user);
            return credential.user;
        } catch (error) {
            this.handleFailedLogin('facebook-auth');
            this.logSecurityEvent('facebook_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    async loginWithApple(): Promise<User> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new OAuthProvider('apple.com');
            provider.addScope('email name');
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });
            const credential = await signInWithPopup(this.auth, provider);
            if (!this.validateState(state)) throw new Error('Invalid state parameter');
            this.resetLoginMetrics();
            this.logSecurityEvent('apple_login_success', { uid: credential.user.uid });
            await this.registerAccount(credential.user);
            return credential.user;
        } catch (error) {
            this.handleFailedLogin('apple-auth');
            this.logSecurityEvent('apple_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    async loginWithGithub(): Promise<User> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new OAuthProvider('github.com');
            provider.addScope('user:email');
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });
            const credential = await signInWithPopup(this.auth, provider);
            if (!this.validateState(state)) throw new Error('Invalid state parameter');
            this.resetLoginMetrics();
            this.logSecurityEvent('github_login_success', { uid: credential.user.uid });
            await this.registerAccount(credential.user);
            return credential.user;
        } catch (error) {
            this.handleFailedLogin('github-auth');
            this.logSecurityEvent('github_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    async loginWithTwitter(): Promise<User> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new TwitterAuthProvider();
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });
            const credential = await signInWithPopup(this.auth, provider);
            if (!this.validateState(state)) throw new Error('Invalid state parameter');
            this.resetLoginMetrics();
            this.logSecurityEvent('twitter_login_success', { uid: credential.user.uid });
            await this.registerAccount(credential.user);
            return credential.user;
        } catch (error) {
            this.handleFailedLogin('twitter-auth');
            this.logSecurityEvent('twitter_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    async registerAccount(user: User): Promise<boolean> {
        const isNew = this.checkIfNewUser(user.metadata.creationTime!, user.metadata.lastSignInTime!);
        if (isNew) {
            await this.userService.createUser({
                uid: user.uid,
                displayName: user.displayName,
            });
        }
        return true;
    }

    async logout(): Promise<void> {
        try {
            const user = this.user();
            await signOut(this.auth);
            this.user.set(null);
            this.cachedToken = null; // Clear cached token on logout
            await this.router.navigate(['/auth/login']);
            this.logSecurityEvent('logout_success', { uid: user?.uid });
        } catch (error) {
            this.logSecurityEvent('logout_error', { message: 'Logout failed' });
            throw error;
        }
    }

    async showLoginForm(): Promise<void> {
        const currentUrl = this.router.url;
        this.setRedirectUrl(currentUrl);
        await this.router.navigate(['http://localhost:8080/auth/login'], {
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

        const state = window.crypto.randomUUID();
        sessionStorage.setItem('auth_state', state);
        return state;
    }

    private validateState(expectedState: string): boolean {
        const actualState = new URLSearchParams(window.location.search).get('state');
        const storedState = sessionStorage.getItem('auth_state');
        sessionStorage.removeItem('auth_state');
        return expectedState === actualState && expectedState === storedState;
    }

    private isLocked(): boolean {
        const metrics = this.loginMetrics();
        return metrics.lockoutUntil !== undefined && Date.now() < metrics.lockoutUntil;
    }

    private handleFailedLogin(email: string): void {
        const metrics = this.loginMetrics();
        const attempts = metrics.attempts + 1;
        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
            this.saveLoginMetrics({
                attempts: 0,
                lastAttempt: Date.now(),
                lockoutUntil: Date.now() + this.LOCKOUT_DURATION
            });
        } else {
            this.saveLoginMetrics({
                ...metrics,
                attempts,
                lastAttempt: Date.now()
            });
        }
    }

    private resetLoginMetrics(): void {
        this.saveLoginMetrics({
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

    private async updateBackendToken(token: string | null): Promise<void> {
        if (!token) {
            console.error('No token to update on backend');
            return;
        }

        try {
            // Use regular HTTP client but with custom headers to avoid interceptor
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Send token in header, not as query param
            };

            // Create a non-intercepted fetch request
            const response = await fetch(`${environment.apiUrl}/api/auth/token-refresh`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ token }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Token refresh failed with status: ${response.status}`);
            }

            console.log('Backend token updated successfully');
        } catch (error) {
            console.error('Token refresh error:', error);
            // Continue auth flow even if backend sync fails
        }
    }
}

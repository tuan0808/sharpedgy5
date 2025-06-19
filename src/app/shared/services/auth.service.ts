/**
 * @fileoverview Authentication service for handling user login, logout, and session management
 * using Firebase Authentication. Supports hybrid authentication: `signInWithPopup` for desktop
 * devices and `signInWithRedirect` for mobile devices, determined by user-agent detection.
 * Manages user sessions, token refresh, login metrics, and security event logging.
 *
 * @example
 * ```typescript
 * constructor(private authService: AuthService) {}
 * async loginWithGoogle() {
 *   try {
 *     const user = await this.authService.loginWithGoogle();
 *     if (user) console.log('Logged in:', user.uid);
 *   } catch (error) {
 *     console.error('Login failed:', error);
 *   }
 * }
 * ```
 */

import { computed, effect, inject, Injectable, Signal, signal } from '@angular/core';
import {
    signInWithEmailAndPassword, GoogleAuthProvider, signOut, User, onAuthStateChanged, Auth, browserLocalPersistence,
    signInWithRedirect, getRedirectResult, FacebookAuthProvider, OAuthProvider, TwitterAuthProvider,
    getIdTokenResult, onIdTokenChanged, signInWithPopup
} from '@angular/fire/auth';
import { setPersistence } from 'firebase/auth';
import { Router } from '@angular/router';
import { LoginMetrics } from '../model/auth/LoginMetrics';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { firstValueFrom, of, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Authentication service for Firebase-based user management.
 * @classdesc Handles authentication flows, session management, token refresh, and security logging.
 * Uses a hybrid approach: popups for desktop, redirects for mobile.
 */
@Injectable({
    providedIn: 'root'
})

export class AuthService {
    /** Duration of a user session (24 hours in milliseconds). */
    private readonly SESSION_DURATION = 24 * 60 * 60 * 1000;
    /** Maximum login attempts before lockout. */
    private readonly MAX_LOGIN_ATTEMPTS = 3;
    /** Lockout duration after max attempts (15 minutes in milliseconds). */
    private readonly LOCKOUT_DURATION = 15 * 60 * 1000;
    /** Buffer time before token refresh (60 seconds). */
    private readonly TOKEN_REFRESH_BUFFER = 60;
    /** Stores the URL to redirect to after authentication. */
    private redirectUrl: string | null = null;
    /** Injected UserService for user data management. */
    private readonly userService: UserService = inject(UserService);
    /** Injected Router for navigation. */
    private readonly router = inject(Router);
    /** Injected Firebase Auth instance. */
    readonly auth = inject(Auth);
    /** Injected HttpClient for potential API calls. */
    private readonly http: HttpClient = inject(HttpClient);

    /** Signal storing the current authenticated user or null. */
    private readonly user = signal<User | null>(null);
    /** Signal indicating if authentication is initialized. */
    private readonly authInitialized = signal<boolean>(false);
    /** Signal storing login metrics (attempts, lockout). */
    private readonly loginMetrics = signal<LoginMetrics>(this.loadLoginMetrics());
    /** Cached JWT token and its expiration time. */
    public cachedToken: { token: string, expiresAt: number } | null = null;

    /** Subject emitting authentication error events. */
    private readonly authErrorSubject = new Subject<void>();
    /** Subject emitting token update events. */
    private readonly tokenUpdateSubject = new Subject<string | null>();

    /** Observable for authentication error events. */
    get authError$() {
        return this.authErrorSubject.asObservable();
    }
    /** Observable for token update events. */
    get tokenUpdate$() {
        return this.tokenUpdateSubject.asObservable();
    }

    /** Computed signal indicating if a user is authenticated. */
    readonly isAuthenticated: Signal<boolean> = computed(() => !!this.user());
    /** Computed signal providing the user's display name or email. */
    readonly displayName: Signal<string> = computed(() =>
        this.user()?.displayName || this.user()?.email || 'Guest'
    );

    /** Signal indicating if the user has admin privileges. */
    private readonly isAdminSignal = signal<boolean>(false);
    /** Computed signal for admin status. */
    readonly isAdmin: Signal<boolean> = computed(() => this.isAdminSignal());

    /** Timeout ID for session expiration. */
    private sessionTimeout?: number;

    /**
     * Initializes session management and token monitoring.
     */
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
            if (!environment.production) {
                console.log('TESTING: onIdTokenChanged triggered, user:', user ? user.uid : null);
            }
            this.user.set(user);
            if (user) {
                await this.checkTokenValidity(user);
            } else {
                this.cachedToken = null;
                this.tokenUpdateSubject.next(null);
            }
        });
    }

    /**
     * Checks and refreshes the user's JWT token if nearing expiry.
     * Logs the token in development for testing purposes.
     * Avoids unnecessary refreshes by reusing valid tokens.
     * @param user - The authenticated user.
     * @returns Promise resolving when token is validated or refreshed.
     */
    private async checkTokenValidity(user: User): Promise<void> {
        const now = Date.now() / 1000;
        if (this.cachedToken && this.cachedToken.expiresAt > now + this.TOKEN_REFRESH_BUFFER) {
            console.log('Using cached token, expires in:', Math.round(this.cachedToken.expiresAt - now), 'seconds');
            this.tokenUpdateSubject.next(this.cachedToken.token);
            return;
        }

        try {
            console.log('Token nearing expiry or invalid, refreshing...');
            const token = await user.getIdToken(true); // Force refresh here
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.cachedToken = { token, expiresAt: decoded.exp };
            console.log('New token acquired, expires at:', new Date(decoded.exp * 1000));
            this.tokenUpdateSubject.next(token);
        } catch (error) {
            console.error('Error refreshing token:', error);
            this.cachedToken = null;
            this.authErrorSubject.next();
            console.warn('Token refresh failed, logging out...');
            await this.logout();
        }
    }

    /**
     * Ensures Firebase Authentication is initialized with browser persistence.
     * @returns Promise resolving when initialization is complete.
     */
    async ensureAuthInitialized(): Promise<void> {
        if (this.authInitialized()) return;
        try {
            if (!environment.production) {
                console.log('TESTING: Initializing Firebase auth persistence');
            }
            await setPersistence(this.auth, browserLocalPersistence);
            await new Promise<void>(resolve => {
                const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
                    this.user.set(user);
                    this.authInitialized.set(true);
                    unsubscribe();
                    if (!environment.production) {
                        console.log('TESTING: Auth initialized, user:', user ? user.uid : null);
                    }
                    resolve();
                });
            });
        } catch (error) {
            this.logSecurityEvent('auth_init_error', { message: 'Initialization failed' });
            this.authInitialized.set(true);
            if (!environment.production) {
                console.log('TESTING: Auth initialization error:', error);
            }
        }
    }

    /**
     * Handles redirect-based authentication results on app initialization.
     * @returns Promise resolving with the authenticated user or null.
     * @throws Error if redirect authentication fails.
     */
    async handleRedirectResult(): Promise<User | null> {
        try {
            const result = await getRedirectResult(this.auth);
            if (result?.user) {
                this.resetLoginMetrics();

                const providerId = result.providerId;
                let eventType = 'redirect_login_success';

                switch (providerId) {
                    case 'google.com':
                        eventType = 'google_login_success';
                        break;
                    case 'facebook.com':
                        eventType = 'facebook_login_success';
                        break;
                    case 'apple.com':
                        eventType = 'apple_login_success';
                        break;
                    case 'github.com':
                        eventType = 'github_login_success';
                        break;
                    case 'twitter.com':
                        eventType = 'twitter_login_success';
                        break;
                }

                this.logSecurityEvent(eventType, { uid: result.user.uid });
                await this.registerAccount(result.user);
                return result.user;
            }
            return null;
        } catch (error) {
            this.logSecurityEvent('redirect_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    /**
     * Verifies if the user has admin privileges via token claims.
     * @param user - The authenticated user.
     * @returns Promise resolving when admin status is checked.
     */
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

    /**
     * Loads login metrics from localStorage.
     * @returns LoginMetrics object with attempt count and lockout info.
     */
    private loadLoginMetrics(): LoginMetrics {
        const stored = localStorage.getItem('login_metrics');
        return stored ? JSON.parse(stored) : { attempts: 0, lastAttempt: 0 };
    }

    /**
     * Saves login metrics to localStorage and updates signal.
     * @param metrics - Updated login metrics.
     */
    private saveLoginMetrics(metrics: LoginMetrics): void {
        localStorage.setItem('login_metrics', JSON.stringify(metrics));
        this.loginMetrics.set(metrics);
    }

    /**
     * Checks if a user is new by comparing creation and last sign-in times.
     * @param creationTime - User account creation time.
     * @param lastSignInTime - Last sign-in time.
     * @returns True if the user is new.
     */
    checkIfNewUser(creationTime: string, lastSignInTime: string): boolean {
        return creationTime === lastSignInTime;
    }

    /**
     * Retrieves the current user's UID.
     * @returns Promise resolving with the UID or null if not authenticated.
     */
    async getUID(): Promise<string | null> {
        await this.ensureAuthInitialized();
        return this.user()?.uid ?? null;
    }

    /**
     * Fetches a fresh JWT token, optionally forcing a refresh.
     * Logs the token in development for testing purposes and debug info for token unavailability.
     * Avoids unnecessary refreshes by reusing valid cached tokens.
     * @param forceRefresh - Whether to force token refresh.
     * @returns Promise resolving with the token or null if unavailable.
     */
    async getFreshToken(forceRefresh = false): Promise<string | null> {
        await this.ensureAuthInitialized();
        const user = this.auth.currentUser;
        if (!user) {
            if (!environment.production) {
                console.log('TESTING: No user logged in, cannot fetch token');
            }
            console.error('No user logged in');
            return null;
        }

        if (!forceRefresh && this.cachedToken && this.cachedToken.expiresAt > Date.now() / 1000 + this.TOKEN_REFRESH_BUFFER) {
            if (!environment.production) {
                console.log('TESTING: Using cached token:', this.cachedToken.token);
                console.log('TESTING: Cached token valid, expires in:', Math.round(this.cachedToken.expiresAt - Date.now() / 1000), 'seconds');
            }
            return this.cachedToken.token;
        }

        try {
            console.log('Fetching fresh token...');
            const token = await user.getIdToken(forceRefresh);
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.cachedToken = { token, expiresAt: decoded.exp };
            if (!environment.production) {
                console.log('TESTING: Fresh token:', token);
            }
            console.log('Fresh token acquired, expires at:', new Date(decoded.exp * 1000));
            this.tokenUpdateSubject.next(token);
            return token;
        } catch (error) {
            if (!environment.production) {
                console.log('TESTING: Token fetch failed:', error);
            }
            console.error('Error fetching fresh token:', error);
            this.cachedToken = null;
            this.authErrorSubject.next();
            if (forceRefresh) {
                console.warn('Token refresh failed, logging out...');
                await this.logout();
            }
            return null;
        }
    }

    /**
     * Manually refreshes the JWT token.
     * @returns Promise resolving with the new token or null.
     */
    async refreshToken(): Promise<string | null> {
        if (!environment.production) {
            console.log('TESTING: Manually refreshing token');
        }
        return this.getFreshToken(true);
    }

    /**
     * Authenticates a user with email and password.
     * @param email - User's email address.
     * @param password - User's password.
     * @returns Promise resolving with the authenticated user.
     * @throws Error if authentication fails or account is locked.
     */
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

    /**
     * Detects if the user is on a mobile device.
     * @returns True if the user-agent indicates a mobile device.
     */
    private isMobileDevice(): boolean {
        return /Mobi|Android/i.test(navigator.userAgent);
    }

    /**
     * Authenticates with Google using popup (desktop) or redirect (mobile).
     * @returns Promise resolving with the user (popup) or null (redirect).
     * @throws Error if authentication fails or account is locked.
     */
    async loginWithGoogle(): Promise<User | null> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('email profile');
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });

            this.setRedirectUrl(this.router.url);

            if (this.isMobileDevice()) {
                await signInWithRedirect(this.auth, provider);
                return null;
            } else {
                const result = await signInWithPopup(this.auth, provider);
                this.resetLoginMetrics();
                this.logSecurityEvent('google_login_success', { uid: result.user.uid });
                await this.registerAccount(result.user);
                return result.user;
            }
        } catch (error) {
            this.handleFailedLogin('google-auth');
            this.logSecurityEvent('google_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    /**
     * Authenticates with Facebook using popup (desktop) or redirect (mobile).
     * @returns Promise resolving with the user (popup) or null (redirect).
     * @throws Error if authentication fails or account is locked.
     */
    async loginWithFacebook(): Promise<User | null> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new FacebookAuthProvider();
            provider.addScope('email');
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });

            this.setRedirectUrl(this.router.url);

            if (this.isMobileDevice()) {
                await signInWithRedirect(this.auth, provider);
                return null;
            } else {
                const result = await signInWithPopup(this.auth, provider);
                this.resetLoginMetrics();
                this.logSecurityEvent('facebook_login_success', { uid: result.user.uid });
                await this.registerAccount(result.user);
                return result.user;
            }
        } catch (error) {
            this.handleFailedLogin('facebook-auth');
            this.logSecurityEvent('facebook_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    /**
     * Authenticates with Apple using popup (desktop) or redirect (mobile).
     * @returns Promise resolving with the user (popup) or null (redirect).
     * @throws Error if authentication fails or account is locked.
     */
    async loginWithApple(): Promise<User | null> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new OAuthProvider('apple.com');
            provider.addScope('email name');
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });

            this.setRedirectUrl(this.router.url);

            if (this.isMobileDevice()) {
                await signInWithRedirect(this.auth, provider);
                return null;
            } else {
                const result = await signInWithPopup(this.auth, provider);
                this.resetLoginMetrics();
                this.logSecurityEvent('apple_login_success', { uid: result.user.uid });
                await this.registerAccount(result.user);
                return result.user;
            }
        } catch (error) {
            this.handleFailedLogin('apple-auth');
            this.logSecurityEvent('apple_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    /**
     * Authenticates with GitHub using popup (desktop) or redirect (mobile).
     * @returns Promise resolving with the user (popup) or null (redirect).
     * @throws Error if authentication fails or account is locked.
     */
    async loginWithGithub(): Promise<User | null> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new OAuthProvider('github.com');
            provider.addScope('user:email');
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });

            this.setRedirectUrl(this.router.url);

            if (this.isMobileDevice()) {
                await signInWithRedirect(this.auth, provider);
                return null;
            } else {
                const result = await signInWithPopup(this.auth, provider);
                this.resetLoginMetrics();
                this.logSecurityEvent('github_login_success', { uid: result.user.uid });
                await this.registerAccount(result.user);
                return result.user;
            }
        } catch (error) {
            this.handleFailedLogin('github-auth');
            this.logSecurityEvent('github_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    /**
     * Authenticates with Twitter using popup (desktop) or redirect (mobile).
     * @returns Promise resolving with the user (popup) or null (redirect).
     * @throws Error if authentication fails or account is locked.
     */
    async loginWithTwitter(): Promise<User | null> {
        await this.ensureAuthInitialized();
        if (this.isLocked()) throw new Error('Account temporarily locked');
        try {
            const provider = new TwitterAuthProvider();
            const state = this.generateStateParam();
            provider.setCustomParameters({ state });

            this.setRedirectUrl(this.router.url);

            if (this.isMobileDevice()) {
                await signInWithRedirect(this.auth, provider);
                return null;
            } else {
                const result = await signInWithPopup(this.auth, provider);
                this.resetLoginMetrics();
                this.logSecurityEvent('twitter_login_success', { uid: result.user.uid });
                await this.registerAccount(result.user);
                return result.user;
            }
        } catch (error) {
            this.handleFailedLogin('twitter-auth');
            this.logSecurityEvent('twitter_login_failed', { message: 'Authentication failed' });
            throw error;
        }
    }

    /**
     * Registers a new user in the system if they are new.
     * @param user - The authenticated user.
     * @returns Promise resolving with true if registration succeeds.
     */
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

    /**
     * Logs out the current user and clears session data.
     * @returns Promise resolving when logout is complete.
     * @throws Error if logout fails.
     */
    async logout(): Promise<void> {
        try {
            const user = this.user();
            await signOut(this.auth);
            this.user.set(null);
            this.cachedToken = null;
            this.tokenUpdateSubject.next(null);
            this.redirectUrl = null;
            await this.router.navigate(['/auth/login']);
            this.logSecurityEvent('logout_success', { uid: user?.uid });
        } catch (error) {
            this.logSecurityEvent('logout_error', { message: 'Logout failed' });
            throw error;
        }
    }

    /**
     * Navigates to the login form, preserving the current URL.
     * @returns Promise resolving when navigation is complete.
     */
    async showLoginForm(): Promise<void> {
        const currentUrl = this.router.url;
        this.setRedirectUrl(currentUrl);
        await this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: currentUrl }
        });
    }

    /**
     * Sets the URL to redirect to after authentication.
     * @param url - The URL to store.
     */
    setRedirectUrl(url: string): void {
        this.redirectUrl = url;
        sessionStorage.setItem('auth_redirect_url', url);
    }

    /**
     * Retrieves the stored redirect URL.
     * @returns The redirect URL or null if not set.
     */
    getRedirectUrl(): string | null {
        if (this.redirectUrl) {
            return this.redirectUrl;
        }
        const stored = sessionStorage.getItem('auth_redirect_url');
        if (stored) {
            this.redirectUrl = stored;
            return stored;
        }
        return null;
    }

    /**
     * Clears the stored redirect URL.
     */
    clearRedirectUrl(): void {
        this.redirectUrl = null;
        sessionStorage.removeItem('auth_redirect_url');
    }

    /**
     * Generates a unique state parameter for CSRF protection.
     * @returns The generated state string.
     */
    private generateStateParam(): string {
        const state = window.crypto.randomUUID();
        sessionStorage.setItem('auth_state', state);
        return state;
    }

    /**
     * Validates the state parameter for CSRF protection.
     * @param expectedState - The expected state value.
     * @returns True if the state is valid.
     */
    private validateState(expectedState: string): boolean {
        const actualState = new URLSearchParams(window.location.search).get('state');
        const storedState = sessionStorage.getItem('auth_state');
        sessionStorage.removeItem('auth_state');
        return expectedState === actualState && expectedState === storedState;
    }

    /**
     * Checks if the account is locked due to too many login attempts.
     * @returns True if the account is locked.
     */
    private isLocked(): boolean {
        const metrics = this.loginMetrics();
        return metrics.lockoutUntil !== undefined && Date.now() < metrics.lockoutUntil;
    }

    /**
     * Handles a failed login attempt, updating metrics and lockout.
     * @param email - The email or identifier used for login.
     */
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

    /**
     * Resets login metrics after a successful login.
     */
    private resetLoginMetrics(): void {
        this.saveLoginMetrics({
            attempts: 0,
            lastAttempt: Date.now()
        });
    }

    /**
     * Logs security events for auditing.
     * @param event - The event name (e.g., 'login_success').
     * @param data - Additional event data.
     */
    logSecurityEvent(event: string, data?: Record<string, any>): void {
        if (environment.production) {
            console.info(`Security Event: ${event}`, data);
        } else {
            console.debug(`Security Event: ${event}`, data);
        }
    }
}

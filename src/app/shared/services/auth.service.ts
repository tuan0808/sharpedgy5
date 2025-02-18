import {computed, effect, inject, Injectable, Signal, signal} from '@angular/core';
import {
    signInWithEmailAndPassword,
    signInWithRedirect,
    GoogleAuthProvider,
    signOut,
    User,
    onAuthStateChanged,
    Auth
} from "@angular/fire/auth";
import { browserSessionPersistence, setPersistence } from 'firebase/auth';
import { Router } from "@angular/router";
import {LoginMetrics} from "../model/auth/LoginMetrics";
import {environment} from "../../../environments/environment";
import {AuthErrorDetail} from "../model/auth/AuthErrorDetail";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly SESSION_DURATION = 24 * 60 * 60 * 1000;
    private readonly MAX_LOGIN_ATTEMPTS = 3;
    private readonly LOCKOUT_DURATION = 15 * 60 * 1000;
    private readonly RETRY_ATTEMPTS = 3;
    private readonly RETRY_DELAY = 1000;

    // Dependency injection using inject()
    private readonly router = inject(Router);
    private readonly auth = inject(Auth);

    // State management using signals
    readonly authCheckComplete = signal<boolean>(false);
    readonly user = signal<User | null>(null);
    private readonly loginMetrics = signal<LoginMetrics>({
        attempts: 0,
        lastAttempt: 0
    });
    private readonly returnUrl = signal<string | null>(null);

    // Computed values
    readonly isAuthenticated: Signal<boolean> = computed(() =>
        this.authCheckComplete() && !!this.user()
    );

    readonly displayName: Signal<string> = computed(() =>
        this.user()?.displayName ||
        this.user()?.email ||
        'Guest'
    );

    private sessionTimeout?: number;
    private unsubscribeAuth?: () => void;
    initializationPromise: Promise<void>;

    constructor() {
        this.initializationPromise = this.initAuth();

        // Setup effects
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

    private async initAuth(): Promise<void> {
        try {
            await setPersistence(this.auth, browserSessionPersistence);

            if (this.unsubscribeAuth) {
                this.unsubscribeAuth();
            }

            return new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Auth initialization timeout'));
                }, 10000);

                this.unsubscribeAuth = onAuthStateChanged(
                    this.auth,
                    async (user) => {
                        try {
                            console.debug('Auth state changed:', user?.uid);
                            this.user.set(user);
                            this.authCheckComplete.set(true);

                            if (!user) {
                                this.logSecurityEvent('user_signed_out');
                                await this.router.navigate(['/login']);
                            } else {
                                this.logSecurityEvent('auth_state_changed', { uid: user.uid });
                                const currentReturnUrl = this.returnUrl();
                                if (currentReturnUrl) {
                                    this.returnUrl.set(null);
                                    await this.router.navigate([currentReturnUrl]);
                                }
                            }

                            clearTimeout(timeoutId);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    },
                    (error) => {
                        console.error('Auth state change error:', error);
                        clearTimeout(timeoutId);
                        this.authCheckComplete.set(true);
                        reject(error);
                    }
                );
            });
        } catch (error) {
            this.logSecurityEvent('init_auth_error', { error: (error as Error).message });
            this.authCheckComplete.set(true);
            throw error;
        }
    }

    async getUID(): Promise<string | null> {
        try {
            await Promise.race([
                this.initializationPromise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth initialization timeout')), 5000)
                )
            ]);

            if (!this.authCheckComplete()) {
                await this.initAuth();
            }

            return this.auth.currentUser?.uid ?? null;
        } catch (error) {
            console.error('Error getting UID:', error);
            return null;
        }
    }

    async loginWithGoogle(): Promise<void> {
        try {
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

    async loginWithEmail(email: string, password: string): Promise<User> {
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

    // Effects are now directly in the constructor

    private isLocked(): boolean {
        const metrics = this.loginMetrics();
        return metrics.lockoutUntil !== undefined &&
            Date.now() < metrics.lockoutUntil;
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

    private generateStateParam(): string {
        const state = crypto.randomUUID();
        sessionStorage.setItem('auth_state', state);
        return state;
    }

    private logSecurityEvent(event: string, data?: Record<string, any>): void {
        if (environment.production) {
            console.info(`Security Event: ${event}`, data);
        } else {
            console.debug(`Security Event: ${event}`, data);
        }
    }

    async logout() {
        try {
            const user = this.auth.currentUser;
            await signOut(this.auth);
            this.user.set(null);
            await this.router.navigate(['/login']);
            this.logSecurityEvent('logout_success', { uid: user?.uid });
        } catch (error) {
            this.logSecurityEvent('logout_error', { error: (error as Error).message });
            throw error;
        }
    }
}

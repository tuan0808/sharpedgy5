import {computed, Injectable, signal} from '@angular/core';
import {
    Auth,
    signInWithEmailAndPassword,
    signInWithRedirect,
    GoogleAuthProvider,
    signOut,
    createUserWithEmailAndPassword,
    User,
    onAuthStateChanged,
    getRedirectResult,
    setPersistence,
    browserLocalPersistence,
    AuthProvider,
    AuthError,
    getAuth
} from "@angular/fire/auth";
import { Router } from "@angular/router";
import {Observable, BehaviorSubject, firstValueFrom, interval, take} from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import {filter} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Create the auth state observable and convert to signal
    private readonly authState = toSignal(
        new Observable<User | null>(subscriber =>
            onAuthStateChanged(this.auth, subscriber)
        ),
        { initialValue: null }
    );

    private redirectInProgress = new BehaviorSubject<boolean>(false);
    readonly currentUser = computed(() => this.authState());
    readonly isLoggedIn = computed(() => !!this.currentUser());
    private readonly authReady = signal(false);
    readonly isAuthReady = computed(() => this.authReady());

    constructor(
        private auth: Auth,
        private router: Router
    ) {
        this.initializeAuth();
    }

    private async initializeAuth(): Promise<void> {
        try {
            if (!this.auth?.app) {
                throw new Error('Auth instance not initialized!');
            }

            console.log('Auth service initializing...');

            // Handle any pending redirect results immediately
            await this.handleRedirectResult();

            // Set up auth state listener
            onAuthStateChanged(
                this.auth,
                (user) => {
                    console.log('Auth state changed:', user?.email ?? 'No user');
                    this.handleAuthStateChange(user);
                    if (!this.authReady()) {
                        this.authReady.set(true);
                    }
                },
                (error) => {
                    console.error('Auth state change error:', error);
                    this.handleAuthError(error);
                    if (!this.authReady()) {
                        this.authReady.set(true);
                    }
                }
            );

        } catch (error) {
            console.error('Auth initialization failed:', error);
            this.authReady.set(true);
            throw error;
        }
    }

    async getUUID(): Promise<string | null> {
        // Wait for auth to be ready before returning UUID
        if (!this.authReady()) {
            await firstValueFrom(interval(100).pipe(
                filter(() => this.authReady()),
                take(1)
            ));
        }
        return this.currentUser()?.uid ?? null;
    }


    async signInWithRedirect(provider: AuthProvider): Promise<void> {
        try {
            this.redirectInProgress.next(true);
            console.log('Starting sign in process:', {
                timestamp: new Date().toISOString(),
                providerType: provider.constructor.name
            });

            if (provider instanceof GoogleAuthProvider) {
                this.configureGoogleProvider(provider);
            }

            // Store the intended redirect URL
            sessionStorage.setItem('authRedirectUrl', '/dashboard');

            await signInWithRedirect(this.auth, provider);
            console.log('Redirect initiated successfully');
        } catch (error) {
            this.redirectInProgress.next(false);
            console.error('Social login redirect failed:', this.formatError(error));
            throw error;
        }
    }

    async signInWithGoogle(): Promise<void> {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            // Add desired scopes
            provider.addScope('email');
            provider.addScope('profile');

            console.log('Starting Google sign-in redirect...');
            await signInWithRedirect(this.auth, provider);
            // Note: Code after this line won't execute immediately due to redirect
        } catch (error) {
            console.error('Failed to start Google sign-in:', error);
            throw error;
        }
    }

    private configureGoogleProvider(provider: GoogleAuthProvider): void {
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({
            prompt: 'select_account',
            access_type: 'offline'
        });
        console.log('Google provider configured with scopes and parameters');
    }

    private async handleRedirectResult(): Promise<void> {
        if (!this.redirectInProgress.value) {
            return;
        }

        try {
            console.log('Processing redirect result');
            const result = await getRedirectResult(this.auth);

            if (result?.user) {
                console.log('Redirect sign-in successful:', {
                    uid: result.user.uid,
                    email: result.user.email,
                    provider: result.providerId
                });

                // Get stored redirect URL
                const redirectUrl = sessionStorage.getItem('authRedirectUrl') || '/dashboard';
                sessionStorage.removeItem('authRedirectUrl');

                // Wait for auth state to be fully updated
                await this.waitForAuthStateUpdate();
                await this.router.navigate([redirectUrl]);
            }
        } catch (error) {
            console.error('Redirect result handling failed:', this.formatError(error));
            await this.router.navigate(['/auth/login']);
        } finally {
            this.redirectInProgress.next(false);
        }
    }

    private async waitForAuthStateUpdate(): Promise<void> {
        return new Promise<void>((resolve) => {
            const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                if (user) {
                    unsubscribe();
                    resolve();
                }
            });

            // Add timeout to prevent hanging
            setTimeout(() => {
                unsubscribe();
                resolve();
            }, 5000);
        });
    }


    async loginWithEmail(email: string, password: string): Promise<boolean> {
        try {
            const result = await signInWithEmailAndPassword(this.auth, email, password);

            if (result.user) {
                await this.waitForAuthStateUpdate();
                await this.handleSuccessfulLogin();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Email login failed:', this.formatError(error));
            return false;
        }
    }

    async register(email: string, password: string): Promise<void> {
        try {
            const result = await createUserWithEmailAndPassword(this.auth, email, password);
            if (result.user) {
                await this.router.navigate(['auth/convinceUrNotARobot']);
            }
        } catch (error) {
            console.error('Registration failed:', this.formatError(error));
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            await signOut(this.auth);
            await this.router.navigate(['/auth/login']);
        } catch (error) {
            console.error('Logout failed:', this.formatError(error));
            throw error;
        }
    }

    private async handleSuccessfulLogin(): Promise<void> {
        try {
            await this.router.navigate(['/dashboard']);
        } catch (error) {
            console.error('Post-login navigation failed:', error);
            await this.router.navigate(['/']);
        }
    }

    private handleAuthStateChange(user: User | null): void {
        if (!user) {
            // Uncomment and modify based on your requirements
            // this.router.navigate(['/auth/login'])
            //     .catch(error => console.error('Auth state change navigation failed:', error));
        }
    }

    private handleAuthError(error: Error): void {
        console.error('Authentication error:', this.formatError(error));
    }

    private formatError(error: any): object {
        return {
            name: error?.name,
            code: error?.code,
            message: error?.message,
            stack: error?.stack
        };
    }
}

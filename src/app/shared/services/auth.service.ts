import { computed, Injectable } from '@angular/core';
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
    AuthError
} from "@angular/fire/auth";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Single source of truth for auth state using signals
    private readonly authState = toSignal(
        new Observable<User | null>(subscriber =>
            onAuthStateChanged(this.auth, subscriber)
        ),
        { initialValue: null }
    );

    // Public computed signals for auth state
    readonly currentUser = computed(() => this.authState());
    readonly isLoggedIn = computed(() => !!this.currentUser());

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

            // Log initialization details
            console.log('Auth service initializing...', {
                isInitialized: !!this.auth.app,
                authDomain: this.auth.app.options.authDomain,
                projectId: this.auth.app.options.projectId
            });

            // Set persistence to local
            await setPersistence(this.auth, browserLocalPersistence);

            // Single auth state listener
            onAuthStateChanged(
                this.auth,
                (user) => {
                    console.log('Auth state changed:', user?.email ?? 'No user');
                    this.handleAuthStateChange(user);
                },
                (error) => {
                    console.error('Auth state change error:', error);
                    this.handleAuthError(error);
                }
            );

            // Handle any pending redirect results
            await this.handleRedirectResult();

        } catch (error) {
            console.error('Auth initialization failed:', error);
            throw error;
        }
    }

    async signInWithRedirect(provider: AuthProvider): Promise<void> {
        try {
            console.log('Starting sign in process:', {
                timestamp: new Date().toISOString(),
                providerType: provider.constructor.name
            });

            if (provider instanceof GoogleAuthProvider) {
                this.configureGoogleProvider(provider);
            }

            await signInWithRedirect(this.auth, provider);
            console.log('Redirect initiated successfully');
        } catch (error) {
            console.error('Social login redirect failed:', this.formatError(error));
            throw error;
        }
    }

    private configureGoogleProvider(provider: GoogleAuthProvider): void {
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        console.log('Google provider configured with scopes and parameters');
    }

    private async handleRedirectResult(): Promise<void> {
        try {
            console.log('Processing redirect result');
            const result = await getRedirectResult(this.auth);

            if (result?.user) {
                // Wait for auth state to be fully updated
                await this.waitForAuthStateUpdate();

                console.log('Redirect sign-in successful:', {
                    uid: result.user.uid,
                    email: result.user.email,
                    provider: result.providerId
                });

                await this.handleSuccessfulLogin();
            }
        } catch (error) {
            console.error('Redirect result handling failed:', this.formatError(error));
            throw error;
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
        });
    }

    async getUUID(): Promise<string | null> {
        return this.currentUser()?.uid ?? null;
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
        // Handle specific auth errors here
        console.error('Authentication error:', this.formatError(error));
        // Implement specific error handling logic as needed
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

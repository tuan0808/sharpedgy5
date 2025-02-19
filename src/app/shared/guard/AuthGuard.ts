import {CanActivateChildFn, Router} from "@angular/router";
import {AuthService} from "../services/auth.service";
import {inject} from "@angular/core";

export const authGuard: CanActivateChildFn = async (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    try {
        // Wait for auth check to complete using public signal
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds with 100ms intervals

        while (!auth.authCheckComplete() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (auth.isAuthenticated()) {
            return true;
        }

        // Capture the exact URL the user was trying to navigate to
        const attemptedUrl = state.url;

        // Store this URL in the auth service for post-login redirect
        auth.setRedirectUrl(attemptedUrl);

        // Trigger authentication flow
        await auth.showLoginForm();  // This should display your login form/modal

        return false;
    } catch (error) {
        console.error('Auth guard error:', error);
        await router.navigate(['/error']);
        return false;
    }
};

import {CanActivateChildFn, Router} from "@angular/router";
import {AuthService} from "../services/auth.service";
import {inject} from "@angular/core";

export const authGuard: CanActivateChildFn = async (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Store the attempted URL for redirecting
    const targetUrl = state.url;

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

        // Navigate to login with return URL in query params
        await router.navigate(['/auth/login'], {
            queryParams: { returnUrl: targetUrl }
        });

        return false;
    } catch (error) {
        console.error('Auth guard error:', error);
        await router.navigate(['/error']);
        return false;
    }
};

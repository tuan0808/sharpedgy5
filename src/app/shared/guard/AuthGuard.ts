import {CanActivateChildFn, Router} from "@angular/router";
import {AuthService} from "../services/auth.service";
import {inject} from "@angular/core";

export const authGuard: CanActivateChildFn = async (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Ensure auth is initialized (lazy init)
    await auth.ensureAuthInitialized();

    // Check if user is authenticated
    if (auth.isAuthenticated()) {
        return true;
    }

    // Capture the attempted URL for redirect after login
    const attemptedUrl = state.url;
    auth.setRedirectUrl(attemptedUrl);

    // Navigate to login page
    await auth.showLoginForm();
    return false;
};

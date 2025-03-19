import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import {BehaviorSubject, from, Observable, retry, throwError, timeout} from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import {DestroyRef, inject} from '@angular/core';
import { AuthService } from "../services/auth.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
    console.log('Interceptor triggered for:', req.url);

    // Skip for specific endpoints
    if (req.url.includes('/account-updates') || req.url.includes('/api/auth/token-refresh')) {
        console.log('Skipping auth for:', req.url);
        return next(req);
    }

    // Check for protected paths
    const protectedPaths = [
        '/api/auth',
        '/dashboard/v1',
        '/users/v1',
        '/webhooks/v1',
        '/paper-betting/v1'
    ];

    // Skip if not a protected path
    if (!protectedPaths.some(path => req.url.includes(path))) {
        return next(req);
    }

    const authService = inject(AuthService);

    // This is the key part: wait for auth initialization to complete
    // before attempting to get the token
    return from(authService.ensureAuthInitialized()).pipe(
        switchMap(() => {
            console.log('Auth initialization confirmed complete');
            return from(authService.getFreshToken());
        }),
        switchMap(token => {
            if (!token) {
                console.warn('No token available after auth init, proceeding without auth');
                return next(req);
            }

            const authReq = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Sending request with auth header after auth init:', req.url);
            return next(authReq);
        }),
        catchError(error => {
            console.error('Error in auth interceptor after auth init:', error);
            return next(req);
        })
    );
};

import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import {BehaviorSubject, from, Observable, retry, throwError, timeout, timer} from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import {DestroyRef, inject} from '@angular/core';
import { AuthService } from "../services/auth.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {environment} from "../../../environments/environment";

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
    console.log('Interceptor triggered for:', req.url);

    // Skip for specific endpoints
    if (req.url.includes('/account-updates') || req.url.includes('/api/auth/token-refresh')) {
        console.log('Skipping auth for:', req.url);
        return applyTimeoutAndRetry(req, next); // Still apply timeout/retry even if skipping auth
    }

    // Check for protected paths
    const protectedPaths = [
        '/api/auth',
        '/dashboard/v1',
        '/users/v1',
        '/webhooks/v1',
        '/paper-betting/v1'
    ];

    // Skip auth (but not timeout/retry) if not a protected path
    if (!protectedPaths.some(path => req.url.includes(path))) {
        return applyTimeoutAndRetry(req, next);
    }

    const authService = inject(AuthService);
    const destroyRef = inject(DestroyRef);

    // Wait for auth initialization and apply token
    return from(authService.ensureAuthInitialized()).pipe(
        switchMap(() => {
            console.log('Auth initialization confirmed complete');
            return from(authService.getFreshToken());
        }),
        switchMap(token => {
            const authReq = token
                ? req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                })
                : req;

            console.log('Sending request with auth header after auth init:', req.url);
            return applyTimeoutAndRetry(authReq, next);
        }),
        takeUntilDestroyed(destroyRef),
        catchError(error => {
            console.error('Error in auth interceptor after auth init:', error);
            return throwError(() => error); // Let the caller handle the error
        })
    );
};

// Helper function to apply timeout and retry logic
function applyTimeoutAndRetry(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
    return next(req).pipe(
        timeout(environment.timeouts.requestTimeout),
        retry({
            count: environment.timeouts.maxApiRetries, //MAX_API_RETRIES
            delay: (error, retryCount) => {
                const delayMs = environment.timeouts.baseRetryDelay * Math.pow(1.5, retryCount); // Exponential backoff BASE_RETRY_DELAY
                console.log(`Retrying request (${retryCount}/${environment.timeouts.maxApiRetries}) in ${delayMs}ms for: ${req.url}`);
                return timer(delayMs);
            }
        }),
        catchError(error => {
            console.error(`Request failed after ${environment.timeouts.maxApiRetries} retries for: ${req.url}`, error);
            return throwError(() => error); // Propagate the error to the caller
        })
    );
}

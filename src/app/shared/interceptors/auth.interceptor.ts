import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, from, Observable, throwError, timer } from 'rxjs';
import { catchError, filter, take, switchMap, retry, timeout } from 'rxjs/operators';
import { DestroyRef, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
    console.log('Interceptor triggered for:', req.url);

    // Skip for specific endpoints
    if (req.url.includes('/account-updates') || req.url.includes('/api/auth/token-refresh')) {
        console.log('Skipping auth for:', req.url);
        return applyTimeoutAndRetry(req, next);
    }

    // Check for protected paths
    const protectedPaths = [
        '/api/auth',
        '/dashboard/v1',
        '/users/v1',
        '/webhooks/v1',
        '/paper-betting/v1',
        '/predictions/v1'
    ];

    // Skip auth (but not timeout/retry) if not a protected path
    if (!protectedPaths.some(path => req.url.includes(path))) {
        return applyTimeoutAndRetry(req, next);
    }

    const authService = inject(AuthService);
    const destroyRef = inject(DestroyRef);

    // Token refresh state
    let tokenRefreshInProgress = false;
    const tokenRefreshedSubject = new BehaviorSubject<string | null>(null);

    return from(authService.ensureAuthInitialized()).pipe(
        switchMap(() => authService.getFreshToken()),
        switchMap(token => {
            const authReq = token
                ? req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                })
                : req;

            console.log('Sending request with auth header:', req.url, 'Token:', token);
            return applyTimeoutAndRetry(authReq, next).pipe(
                catchError((error: HttpErrorResponse) => {
                    if (error.status === 401 && !req.url.includes('/api/auth/token-refresh')) {
                        console.log('401 detected, attempting token refresh for:', req.url);

                        if (tokenRefreshInProgress) {
                            return tokenRefreshedSubject.pipe(
                                filter(token => token !== null),
                                take(1),
                                switchMap(newToken => {
                                    const retryReq = newToken
                                        ? req.clone({
                                            setHeaders: {
                                                Authorization: `Bearer ${newToken}`
                                            }
                                        })
                                        : req;
                                    console.log('Retrying with new token:', req.url, 'Token:', newToken);
                                    return applyTimeoutAndRetry(retryReq, next);
                                }),
                                catchError(() => {
                                    console.error('Token refresh failed, throwing error:', req.url);
                                    return throwError(() => error);
                                })
                            );
                        }

                        tokenRefreshInProgress = true;
                        return from(authService.refreshToken()).pipe(
                            switchMap(newToken => {
                                tokenRefreshInProgress = false;
                                tokenRefreshedSubject.next(newToken);
                                if (!newToken) {
                                    console.error('No new token received, throwing error:', req.url);
                                    return throwError(() => new Error('Token refresh failed'));
                                }
                                const retryReq = req.clone({
                                    setHeaders: {
                                        Authorization: `Bearer ${newToken}`
                                    }
                                });
                                console.log('Retrying with new token:', req.url, 'Token:', newToken);
                                return applyTimeoutAndRetry(retryReq, next);
                            }),
                            catchError(refreshError => {
                                tokenRefreshInProgress = false;
                                tokenRefreshedSubject.next(null);
                                console.error('Token refresh failed:', refreshError);
                                return throwError(() => refreshError);
                            })
                        );
                    }

                    console.error('Error in auth interceptor:', error);
                    return throwError(() => error);
                })
            );
        }),
        takeUntilDestroyed(destroyRef),
        catchError(error => {
            console.error('Error in auth interceptor init:', error);
            return throwError(() => error);
        })
    );
};

function applyTimeoutAndRetry(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
    return next(req).pipe(
        timeout(environment.timeouts.requestTimeout),
        retry({
            count: environment.timeouts.maxApiRetries,
            delay: (error, retryCount) => {
                const delayMs = environment.timeouts.baseRetryDelay * Math.pow(1.5, retryCount);
                console.log(`Retrying request (${retryCount}/${environment.timeouts.maxApiRetries}) in ${delayMs}ms for: ${req.url}`);
                return timer(delayMs);
            }
        }),
        catchError(error => {
            console.error(`Request failed after ${environment.timeouts.maxApiRetries} retries for: ${req.url}`, error);
            return throwError(() => error);
        })
    );
}

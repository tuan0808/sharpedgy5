
console.log(`~~~~~Loading the interceptor`)
/**
 * @fileoverview HTTP interceptor for adding Firebase Authentication tokens to API requests
 * and handling 401 errors by refreshing tokens. Integrates with AuthService for token management.
 * Supports concurrent request queuing during token refresh and logs security events.
 *
 * @example
 * ```typescript
 * // Provided in app.module.ts or app.config.ts
 * providers: [
 *   { provide: HTTP_INTERCEPTORS, useValue: authInterceptor, multi: true }
 * ]
 * ```
 */

import { HttpInterceptorFn, HttpRequest, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {throwError, BehaviorSubject, from, of} from 'rxjs';
import {catchError, switchMap, filter, take, map, tap} from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/** Shared state for token refresh coordination. */
let isRefreshing = false;
/** Subject emitting refreshed tokens to queued requests. */
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

/**
 * Debug version with extensive logging
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    console.log(`🔍 INTERCEPTOR START: ${req.method} ${req.url}`);

    const authService = inject(AuthService);

    // Skip non-API requests
    // if (!req.url.includes(environment.apiUrl)) {
    //     console.log(`⚠️ Skipping non-API URL: ${req.url}`);
    //     return next(req);
    // }

    console.log(`🔑 API request detected, getting token...`);

    // Convert getFreshToken Promise to Observable and chain
    return from(authService.getFreshToken()).pipe(
        tap(token => console.log(`🔍 Token received:`, token ? 'YES' : 'NO')),
        switchMap(token => {
            let finalReq = req;

            if (token) {
                finalReq = req.clone({
                    setHeaders: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log(`✅ Authorization header added: Bearer ${token.substring(0, 20)}...`);
                console.log(`🔍 All headers:`, finalReq.headers.keys());

                // Verify the header was actually set
                const authHeader = finalReq.headers.get('Authorization');
                console.log(`🔍 Auth header verification:`, authHeader ? 'PRESENT' : 'MISSING');
            } else {
                console.log(`❌ No token available, proceeding without auth`);
            }

            return next(finalReq);
        }),
        catchError((error: HttpErrorResponse) => {
            console.error(`❌ Request failed:`, error.status, error.message);
            console.error(`❌ Error details:`, error);

            if (error.status === 401) {
                console.log(`🔄 401 detected, user authenticated:`, authService.isAuthenticated());
            }

            return throwError(() => error);
        })
    );
};

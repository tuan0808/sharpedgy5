import { HttpInterceptorFn, HttpRequest, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, BehaviorSubject, from, of, timer, finalize } from 'rxjs';
import { catchError, switchMap, filter, take, tap, delay } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    console.log(`🔍 INTERCEPTOR START: ${req.method} ${req.url}`);
    const authService = inject(AuthService);



    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    }

    console.log(JSON.stringify(req.body))
    if (req.url.endsWith('/favicon.ico')) {
        console.log(`🔍 Skipping favicon request`);
        return next(req);
    }

    console.log(req.body)

    if (!isRefreshing) {
        isRefreshing = true;
        return from(authService.getFreshToken()).pipe(
            delay(500), // Adjustable delay to ensure token is ready
            tap(token => {
                console.log(`🔍 Token received:`, token ? 'YES' : 'NO');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        console.log(`🔍 Token claims:`, payload);
                        console.log(`🔍 Issued at: ${new Date(payload.iat * 1000).toISOString()}`);
                        console.log(`🔍 Expires at: ${new Date(payload.exp * 1000).toISOString()}`);
                        if (payload.iat === payload.exp) {
                            console.warn(`🔍 WARNING: Token expiration matches issuance time!`);
                        }
                    } catch (e) {
                        console.error(`🔍 Error decoding token:`, e);
                    }
                }
            }),
            switchMap(token => {
                if (token) {
                    const finalReq = req.clone({
                        setHeaders: { 'Authorization': `Bearer ${token}` },
                        withCredentials: true,
                    });
                    console.log(`✅ Authorization header added: Bearer ${token.substring(0, 20)}...`);
                    refreshTokenSubject.next(token);
                    return next(finalReq);
                }
                console.log(`❌ No token available`);
                refreshTokenSubject.next(null);
                return next(req);
            }),
            catchError((error: HttpErrorResponse) => {
                console.error(`❌ Request failed:`, error.status, error.message);
                refreshTokenSubject.next(null);
                return throwError(() => error);
            }),
            finalize(() => {
                isRefreshing = false;
            })
        );
    }

    // Wait for refresh if already in progress
    return refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
            const finalReq = req.clone({
                setHeaders: { 'Authorization': `Bearer ${token}` },
                withCredentials: true,
            });
            console.log(`✅ Using refreshed token: Bearer ${token.substring(0, 20)}...`);
            return next(finalReq);
        }),
        catchError((error: HttpErrorResponse) => {
            console.error(`❌ Request failed during refresh:`, error.status, error.message);
            return throwError(() => error);
        })
    );
};

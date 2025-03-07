import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from "../services/auth.service";

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
    console.log('Interceptor triggered for:', req.url);
    const protectedPaths = [
        '/api/auth/token-refresh',
        '/dashboard/v1',
        '/users/v1',
        '/webhooks/v1',
        '/paper-betting/v1'
    ];

    // Use startsWith for more precise matching
    if (!protectedPaths.some(path => req.url.startsWith(path))) {
        return next(req);
    }

    const authService = inject(AuthService);
    const tokenSubject = new BehaviorSubject<string | null>(null);

    // Debounce token fetches to once per second
    from(authService.getFreshToken()).pipe(
        debounceTime(1000) // Batch rapid requests within 1s
    ).subscribe(token => tokenSubject.next(token));

    return tokenSubject.pipe(
        switchMap(token => {
            if (!token) {
                console.warn('No token available, proceeding without auth');
                return next(req);
            }
            const authReq = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
            });
            console.log('Sending token:', authReq);
            return next(authReq);
        }),
        catchError(error => {
            console.error('Error fetching token:', error);
            return throwError(() => error);
        })
    );
};

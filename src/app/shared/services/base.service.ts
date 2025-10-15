// src/app/services/base.service.ts
import { Injectable, inject, DestroyRef, Injector, signal, Signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Injectable({
    providedIn: 'root'
})
export class BaseService<T> {
    protected http = inject(HttpClient);
    protected destroyRef = inject(DestroyRef);
    private injector = inject(Injector); // Inject Injector
    protected  apiUrl = 'http://localhost:9080';

    protected isLoading = signal<boolean>(false);
    protected errorMessage = signal<string | null>(null);
    protected userId = signal<string | null>(null);

    // Lazily resolve AuthService
    protected get auth(): AuthService {
        return this.injector.get(AuthService);
    }

    constructor() {}

    protected async initializeUser(retryCount = 0, maxRetries = 3): Promise<string | null> {
        try {
            this.isLoading.set(true);
            this.errorMessage.set(null);

            const userId = await Promise.race<string | null>([
                this.auth.getUID(),
                new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 5000)
                ),
            ]);

            if (!userId) {
                throw new Error('Failed to get user ID');
            }

            this.userId.set(userId);
            this.isLoading.set(false);
            return userId;
        } catch (error) {
            console.error('Error initializing user:', error);
            this.errorMessage.set('Failed to initialize user');

            if (retryCount < maxRetries) {
                const delayMs = 2000 * Math.pow(1.5, retryCount);
                console.log(`Retry ${retryCount + 1}/${maxRetries} in ${delayMs}ms`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                return this.initializeUser(retryCount + 1, maxRetries);
            } else {
                console.error('Failed to initialize user after max retries');
                this.errorMessage.set('Failed to initialize after multiple attempts');
                this.userId.set(null);
                this.isLoading.set(false);
                return null;
            }
        }
    }

    // Updated get method to support HttpParams
    protected get<R>(
        url: string,
        errorMsg: string,
        options: {
            withCredentials?: boolean;
            params?: HttpParams;
        } = {}
    ): Observable<R> {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        const httpOptions = {
            withCredentials: options.withCredentials ?? true,
            ...(options.params && { params: options.params })
        };

        return this.http.get<R>(url, httpOptions).pipe(
            takeUntilDestroyed(this.destroyRef),
            retry({ count: 3, delay: 1000, resetOnSuccess: true }),
            map(response => {
                this.isLoading.set(false);
                this.errorMessage.set(null);
                return response;
            }),
            catchError(error => {
                console.error(`Error fetching ${url}:`, error);
                this.isLoading.set(false);
                this.errorMessage.set(errorMsg);
                return of(null as R);
            })
        );
    }

    protected post<R, B>(url: string, body: B, errorMsg: string, options: { withCredentials?: boolean } = {}): Observable<R> {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        return this.http.post<R>(url, body, { withCredentials: options.withCredentials ?? true }).pipe(
            takeUntilDestroyed(this.destroyRef),
            retry({ count: 3, delay: 1000, resetOnSuccess: true }),
            map(response => {
                this.isLoading.set(false);
                this.errorMessage.set(null);
                return response;
            }),
            catchError(error => {
                console.error(`Error posting to ${url}:`, error);
                this.isLoading.set(false);
                this.errorMessage.set(errorMsg);
                return throwError(() => error);
            })
        );
    }

    get loadingSignal(): Signal<boolean> {
        return this.isLoading;
    }

    get errorSignal(): Signal<string | null> {
        return this.errorMessage;
    }

    get userIdSignal(): Signal<string | null> {
        return this.userId;
    }
}

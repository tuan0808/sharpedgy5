import {DestroyRef, inject, Injectable, Signal, signal} from '@angular/core';
import {UserData} from "../model/UserData";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {lastValueFrom, Observable, of, retry, takeUntil, throwError} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {catchError} from "rxjs/operators";
import {PartialUser} from "../model/auth/PartialUser";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient)
    protected user: Signal<UserData> = signal(null)
    private apiUrl = "http://localhost:8080/user/v1"
    private readonly destroyRef = inject(DestroyRef);

    private readonly MAX_INIT_RETRIES = 3;
    private readonly MAX_SSE_RETRIES = 5;
    private readonly BASE_RETRY_DELAY = 2000; // 2 seconds
    private sseRetryCount = 0;

    constructor() {
    }

    getUser(uid: string): Observable<UserData | null> {
        return this.http.get<UserData>(`${this.apiUrl}/${uid}/getUser`).pipe(
            retry(3),
            takeUntilDestroyed(this.destroyRef),
            catchError((error) => {
                if (error instanceof HttpErrorResponse) {
                    console.error('getAccount failed:', error);
                    if (error.status === 0) {
                        console.error('Network or client-side error:', error.error);
                    } else {
                        console.error(
                            `Backend returned code ${error.status}, body was:`,
                            error.error
                        );
                    }
                }
                return of(null);
            })
        );
    }

    async createUser(user: PartialUser): Promise<void> {
        try {
            console.log('Sending:', user);
            console.log('Before HTTP call');

            const response = await lastValueFrom(
                this.http.post(`${this.apiUrl}/register`, user, {
                    observe: 'response', // Get full HttpResponse
                    responseType: 'text' // Treat as text to avoid JSON parsing issues
                }).pipe(
                    retry({
                        count: 3,
                        delay: 1000,
                        resetOnSuccess: true
                    })
                )
            );

            console.log('After HTTP call, Status:', response.status);
            console.log('After HTTP call, Body:', response.body);

            if (response.status !== 200) {
                throw new Error(`Unexpected status: ${response.status}`);
            }
            // Success, no need to parse body
        } catch (error) {
            console.error('Failed to register user after retries:', error);
            throw error;
        }
    }
}

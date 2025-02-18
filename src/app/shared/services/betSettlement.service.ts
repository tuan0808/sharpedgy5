import {computed, DestroyRef, effect, inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {Game} from "../model/paper-betting/Game";
import {Account} from "../model/paper-betting/Account";
import {firstValueFrom, Observable, of, retry, Subject, takeUntil, throwError} from "rxjs";
import {catchError} from "rxjs/operators";
import {BaseApiService} from "./base-api.service";
import {SportType} from "../model/SportType";
import {BetHistory} from "../model/paper-betting/BetHistory";
import {HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {environment} from "../../../environments/environment";
import {BalanceWebhookResponse} from "../model/paper-betting/BalanceWebhookResponse";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";


@Injectable({
    providedIn: 'root'
})
export class BetSettlementService extends BaseApiService<Game> {
    private readonly destroyRef = inject(DestroyRef);
    private readonly auth = inject(AuthService);
    protected override apiUrl = environment.apiUrl + '/webhooks/v1';

    // Signals
     readonly account = signal<Account | null>(null);
    private readonly balance = signal<number>(0);
    private readonly uid = signal<string | null>(null);

    // Computed values
    readonly currentBalance = computed(() => this.balance());
    readonly currentUserId = computed(() => this.uid());

    constructor() {
        super();
        this.initializeUser();

        // Setup automatic cleanup using destroyRef
        this.destroyRef.onDestroy(() => {
            this.cleanup();
        });
    }



    private async initializeUser() {
        try {
            const userId = await this.auth.getUID();
            console.log('Got userId:', userId);

            if (userId) {
                this.uid.set(userId);
                console.log('Set uid signal:', this.uid());

                // Setup initial account data and webhook
                this.setupAccountUpdates(userId);
            }
        } catch (error) {
            console.error('Error initializing user:', error);
        }
    }

    private setupAccountUpdates(userId: string) {
        // Initial account fetch
        this.getAccount(userId).pipe(
            retry(3),
            takeUntilDestroyed(this.destroyRef),
            catchError((error) => {
                console.error('Failed to get account:', error);
                return of(null);
            })
        ).subscribe(accountData => {
            if (accountData) {
                this.account.set(accountData);
            }
        });

        // Setup SSE for real-time updates
        effect(() => {
            const eventSource = new EventSource(`${this.apiUrl}/${userId}/account-updates`);
            console.log('event kicked')
            eventSource.onmessage = (event) => {
                try {
                    const accountUpdate = JSON.parse(event.data) as Account;
                    console.log(`update ${accountUpdate}`)
                    this.account.set(accountUpdate);
                    console.log('Account updated via webhook:', accountUpdate);
                } catch (error) {
                    console.error('Error processing account webhook data:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('Account webhook error:', error);
                eventSource.close();
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.setupAccountUpdates(userId), 5000);
            };

            // Cleanup on effect disposal
            return () => {
                eventSource.close();
            };
        });
    }

    // Public methods
    refreshAccount(): Observable<Account> {
        const userId = this.uid();
        if (!userId) return of(null);

        return this.getAccount(userId).pipe(
            retry(3),
            takeUntilDestroyed(this.destroyRef),
            catchError((error) => {
                console.error('Error refreshing account:', error);
                return of(null);
            })
        );
    }

    getSportsByNFL(sportType: SportType): Observable<Game[]> {
        const userId = this.uid();
        if (!userId) return of([]);

        return this.http.get<Game[]>(`http://localhost:8080/paper-betting/v1/${userId}/${sportType}/getUpcomingGames`)
            .pipe(
                retry(3),
                takeUntilDestroyed(this.destroyRef),
                catchError(this.handleError<Game[]>('getSportsByNFL', []))
            );
    }

    getBalance(uid: string): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/${uid}/getUserBalance`)
            .pipe(
                retry(3),
                takeUntilDestroyed(this.destroyRef),
                catchError(this.handleError<number>('getBalance', 0))
            );
    }

    getAccount(uid: string): Observable<Account> {
        return this.http.get<Account>(`${this.apiUrl}/${uid}/getAccount`).pipe(
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

    addHistory(betHistory: BetHistory): Observable<number> {
        return this.http.post<number>(`${this.apiUrl}/saveBetHistory`, betHistory).pipe(
            retry(1),
            takeUntilDestroyed(this.destroyRef),
            catchError(error => {
                console.error('Error saving bet history:', error);
                return throwError(() => error);
            })
        );
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: HttpErrorResponse): Observable<T> => {
            console.error(`${operation} failed:`, error);
            return of(result as T);
        };
    }

    private cleanup() {
        // Any additional cleanup needed
    }
}

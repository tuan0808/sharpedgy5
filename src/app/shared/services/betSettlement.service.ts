import {computed, DestroyRef, inject, Injectable, signal} from '@angular/core';
import {Game} from "../model/paper-betting/Game";
import {Account} from "../model/paper-betting/Account";
import {firstValueFrom, Observable, of, retry, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {BaseApiService} from "./base-api.service";
import {SportType} from "../model/SportType";
import {BetHistory} from "../model/paper-betting/BetHistory";
import {HttpErrorResponse} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {environment} from "../../../environments/environment";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";


@Injectable({
    providedIn: 'root'
})
export class BetSettlementService extends BaseApiService<Game> {
    private readonly destroyRef = inject(DestroyRef);
    private readonly auth = inject(AuthService);
    protected override apiUrl = environment.apiUrl + '/paper-betting/v1';
    protected webhookUrl = environment.apiUrl + '/webhooks/v1'

    private eventSource?: globalThis.EventSource;
    private readonly MAX_INIT_RETRIES = 3;
    private readonly INIT_RETRY_DELAY = 2000; // 2 seconds

    // Signals
    readonly account = signal<Account | null>(null);
    readonly allGames = signal<Game[]>([]);
    private readonly balance = signal<number>(0);
    private readonly uid = signal<string | null>(null);

    // Computed values
    readonly currentUserId = computed(() => this.uid());

    constructor() {
        super();
        this.initializeUser();
    }

    private async initializeUser(retryCount = 0): Promise<void> {
        try {
            const userId = await Promise.race([
                this.auth.getUID().then(uid => uid as string),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 5000)
                )
            ]);

            if (userId) {
                this.uid.set(userId);
                console.log('Set uid signal:', this.uid());
                await this.setupAccountUpdates(userId);
            } else if (retryCount < this.MAX_INIT_RETRIES) {
                console.log(`Retry ${retryCount + 1} of ${this.MAX_INIT_RETRIES}`);
                setTimeout(() => this.initializeUser(retryCount + 1), this.INIT_RETRY_DELAY);
            } else {
                console.error('Failed to initialize user after max retries');
            }
        } catch (error) {
            console.error('Error initializing user:', error);
            if (retryCount < this.MAX_INIT_RETRIES) {
                console.log(`Retry ${retryCount + 1} of ${this.MAX_INIT_RETRIES}`);
                setTimeout(() => this.initializeUser(retryCount + 1), this.INIT_RETRY_DELAY);
            }
        }
    }

    private async setupAccountUpdates(userId: string): Promise<void> {
        this.cleanup();

        try {
            // Initial account fetch with timeout
            const initialAccount = await Promise.race([
                firstValueFrom(
                    this.getAccount(userId).pipe(
                        retry(3),
                        catchError((error) => {
                            console.error('Failed to get initial account:', error);
                            return of(null);
                        })
                    )
                ),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Account fetch timeout')), 10000)
                )
            ]);

            if (initialAccount) {
                this.account.set(initialAccount);
                this.balance.set(initialAccount.balance);

                // Update any existing games with bet records
                const currentGames = this.allGames();
                if (currentGames.length > 0 && initialAccount.betHistory) {
                    const updatedGames = currentGames.map(game => {
                        const betRecord = initialAccount.betHistory.find(bet => bet.gameId === game.id);
                        if (betRecord) {
                            return {
                                ...game,
                                betSettlement: {
                                    betType: betRecord.betType,
                                    wagerValue: betRecord.wagerValue,
                                    wagerAmount: betRecord.wagerAmount
                                }
                            };
                        }
                        return game;
                    });
                    this.allGames.set(updatedGames);
                }
            }

            // Setup SSE with credentials and timeout
            this.eventSource = new EventSource(
                `${this.webhookUrl}/${userId}/account-updates`,
                { withCredentials: true }
            );

            // Set up connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.eventSource?.readyState !== EventSource.OPEN) {
                    this.cleanup();
                    this.setupAccountUpdates(userId);
                }
            }, 5000);

            this.eventSource.addEventListener('account-update', (event: MessageEvent) => {
                console.log('Received account update event:', event);
                try {
                    const accountUpdate = JSON.parse(event.data) as Account;
                    console.log('Parsed account update:', accountUpdate);

                    // Get the most recent bet history entry
                    const latestBet = accountUpdate.betHistory[accountUpdate.betHistory.length - 1];

                    // Update the specific game's bet record
                    if (latestBet) {
                        this.updateGameBetRecord(latestBet.gameId, latestBet);
                    }

                    // Update account and balance
                    this.account.set(accountUpdate);
                    this.balance.set(accountUpdate.balance);
                } catch (error) {
                    console.error('Error processing account update:', error);
                }
            });

            this.eventSource.onopen = (event) => {
                console.log('SSE connection opened:', event);
                clearTimeout(connectionTimeout);
            };

            this.eventSource.onerror = (error) => {
                console.error('SSE connection error:', error);
                this.cleanup();
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.setupAccountUpdates(userId), 5000);
            };

            // Register cleanup
            this.destroyRef.onDestroy(() => this.cleanup());

        } catch (error) {
            console.error('Error setting up SSE:', error);
            // Attempt to reconnect after error
            setTimeout(() => this.setupAccountUpdates(userId), 5000);
        }
    }

    private cleanup(): void {
        if (this.eventSource) {
            console.log('Cleaning up SSE connection');
            this.eventSource.close();
            this.eventSource = undefined;
        }
    }

    private updateGameBetRecord(gameId: string, betHistory: BetHistory): void {
        this.allGames.update(games => {
            return games.map(game => {
                if (game.id === gameId) {
                    return {
                        ...game,
                        betSettlement: {
                            betType: betHistory.betType,
                            wagerValue: betHistory.wagerValue,
                            wagerAmount: betHistory.wagerAmount
                        }
                    };
                }
                return game;
            });
        });
    }

    // Public methods
    refreshAccount(): Observable<Account | null> {
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

        return this.http.get<Game[]>(`${this.apiUrl}/${userId}/${sportType}/getUpcomingGames`)
            .pipe(
                map(games => {
                    const updatedGames = games.map(game => {
                        const betRecord = this.account()?.betHistory?.find(f => f.gameId === game.id);
                        if (betRecord) {
                            game.betSettlement = {
                                betType: betRecord.betType,
                                wagerValue: betRecord.wagerValue,
                                wagerAmount: betRecord.wagerAmount
                            };
                        }
                        return game;
                    });

                    this.allGames.set(updatedGames);
                    return updatedGames;
                }),
                retry(3),
                takeUntilDestroyed(this.destroyRef),
                catchError(this.handleError<Game[]>('getSportsByNFL', []))
            );
    }


    getAccount(uid: string): Observable<Account | null> {
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
        console.log(`bet history ${JSON.stringify(betHistory)}`);
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

    getAccounts() {
        console.log(`${this.apiUrl}/${this.uid()}/getAccounts`)
        let results = this.http.get<Account[]>(`${this.apiUrl}/${this.uid()}/getAccounts`).pipe(
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
        console.log(results)
        return results
    }
}

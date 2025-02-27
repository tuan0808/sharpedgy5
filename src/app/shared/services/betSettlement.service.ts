import {computed, DestroyRef, inject, Injectable, signal} from '@angular/core';
import {Game} from "../model/paper-betting/Game";
import {Account} from "../model/paper-betting/Account";
import {firstValueFrom, Observable, of, retry, throwError, timeout} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {BaseApiService} from "./base-api.service";
import {SportType} from "../model/SportType";
import {BetHistory} from "../model/paper-betting/BetHistory";
import {HttpErrorResponse} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {environment} from "../../../environments/environment";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";


/**
 * Service for handling bet settlement functionality.
 * Extends BaseApiService to interact with backend APIs.
 */
@Injectable({
    providedIn: 'root'
})
export class BetSettlementService extends BaseApiService<Game> {
    private readonly destroyRef = inject(DestroyRef);
    private readonly auth = inject(AuthService);
    protected override apiUrl = environment.apiUrl + '/paper-betting/v1';
    protected webhookUrl = environment.apiUrl + '/webhooks/v1';

    private eventSource?: globalThis.EventSource;
    private readonly MAX_INIT_RETRIES = 3;
    private readonly MAX_SSE_RETRIES = 5;
    private readonly BASE_RETRY_DELAY = 2000; // 2 seconds
    private sseRetryCount = 0;


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
            let userId = await Promise.race<string>([
                this.auth.getUID(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 5000)
                )
            ]).catch(error => {
                console.error('Error:', error);
                return null;
            });

            if (userId) {
                this.uid.set(userId);
                console.log('Set uid signal:', userId);
                await this.setupAccountUpdates(userId);
            } else if (retryCount < this.MAX_INIT_RETRIES) {
                await this.retryInitialize(retryCount);
            } else {
                console.error('Failed to initialize user after max retries');
            }
        } catch (error) {
            console.error('Error initializing user:', error);
            if (retryCount < this.MAX_INIT_RETRIES) {
                await this.retryInitialize(retryCount);
            }
        }
    }

    private withRetry<T>(action: () => Promise<T>, maxRetries: number): Promise<T> {
        const attempt = async (count: number): Promise<T> => {
            try {
                return await action();
            } catch (error) {
                if (count >= maxRetries) throw error;
                const delayMs = this.BASE_RETRY_DELAY * Math.pow(2, count);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                return attempt(count + 1);
            }
        };
        return attempt(0);
    }

    private async retryInitialize(retryCount: number): Promise<void> {
        const delayMs = this.BASE_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retry ${retryCount + 1} of ${this.MAX_INIT_RETRIES} in ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.initializeUser(retryCount + 1);
    }

    private async setupAccountUpdates(userId: string): Promise<void> {
        this.cleanup();
        await this.fetchInitialAccount(userId);
        this.setupSSE(userId);
    }

    private async fetchInitialAccount(userId: string): Promise<void> {
        const initialAccount = await firstValueFrom(
            this.getAccount(userId).pipe(
                timeout(10000),
                retry({ count: 3, delay: this.BASE_RETRY_DELAY }),
                catchError(error => {
                    console.error('Failed to get initial account:', error);
                    return of(null);
                })
            )
        );

        if (this.isValidAccount(initialAccount)) {
            this.updateAccountState(initialAccount);
        }
    }

    private setupSSE(userId: string): void {
        this.eventSource = new EventSource(
            `${this.webhookUrl}/${userId}/account-updates`,
            { withCredentials: true }
        );

        const connectionTimeout = setTimeout(() => {
            if (this.eventSource?.readyState !== EventSource.OPEN) {
                this.handleSSEError(userId, new Error('SSE connection timeout'));
            }
        }, 5000);

        this.eventSource.addEventListener('account-update', (event: MessageEvent) => {
            try {
                const accountUpdate = JSON.parse(event.data) as Account;
                if (this.isValidAccount(accountUpdate)) {
                    this.updateAccountState(accountUpdate);
                }
            } catch (error) {
                console.error('Error processing account update:', error);
            }
        });

        this.eventSource.onopen = () => {
            console.log('SSE connection opened');
            clearTimeout(connectionTimeout);
            this.sseRetryCount = 0; // Reset retry count on success
        };

        this.eventSource.onerror = (error) => this.handleSSEError(userId, error);

        this.destroyRef.onDestroy(() => this.cleanup());
    }

    private handleSSEError(userId: string, error: unknown): void {
        console.error('SSE connection error:', error);
        this.cleanup();
        if (this.sseRetryCount < this.MAX_SSE_RETRIES) {
            const delayMs = Math.min(this.BASE_RETRY_DELAY * Math.pow(2, this.sseRetryCount), 30000);
            console.log(`SSE reconnect attempt ${this.sseRetryCount + 1}/${this.MAX_SSE_RETRIES} in ${delayMs}ms`);
            setTimeout(() => {
                this.sseRetryCount++;
                this.setupSSE(userId);
            }, delayMs);
        } else {
            console.error('Max SSE reconnect attempts reached');
        }
    }

    private isValidAccount(account: Account | null): account is Account {
        return !!account && typeof account.balance === 'number' && Array.isArray(account.betHistory);
    }

    private updateAccountState(account: Account): void {
        this.account.set(account);
        this.balance.set(account.balance);
        const latestBet = account.betHistory[account.betHistory.length - 1];
        if (latestBet) {
            this.updateGameBetRecord(latestBet.gameId, latestBet);
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
        this.allGames.update(games => games.map(game =>
            game.id === gameId ? { ...game, betSettlement: {
                    betType: betHistory.betType,
                    wagerValue: betHistory.wagerValue,
                    wagerAmount: betHistory.wagerAmount
                }} : game
        ));
    }

    refreshAccount(): Observable<Account | null> {
        const userId = this.uid();
        return userId ? this.getAccount(userId) : of(null);
    }

    getSportsByNFL(sportType: SportType): Observable<Game[]> {
        const userId = this.uid();
        if (!userId) return of([]);

        return this.http.get<Game[]>(`${this.apiUrl}/${userId}/${sportType}/getUpcomingGames`, {withCredentials: true}).pipe(
            map(games => this.updateGamesWithBetHistory(games)),
            retry({ count: 3, delay: this.BASE_RETRY_DELAY }),
            takeUntilDestroyed(this.destroyRef),
            catchError(this.handleError<Game[]>('getSportsByNFL', []))
        );
    }

    private updateGamesWithBetHistory(games: Game[]): Game[] {
        const betHistory = this.account()?.betHistory;
        if (!betHistory) return games;

        const updatedGames = games.map(game => {
            const betRecord = betHistory.find(bet => bet.gameId === game.id);
            return betRecord ? { ...game, betSettlement: {
                    betType: betRecord.betType,
                    wagerValue: betRecord.wagerValue,
                    wagerAmount: betRecord.wagerAmount
                }} : game;
        });
        this.allGames.set(updatedGames);
        return updatedGames;
    }

    getAccount(uid: string): Observable<Account | null> {
        return this.http.get<Account>(`${this.apiUrl}/${uid}/getAccount`, {withCredentials: true}).pipe(
            retry({ count: 3, delay: this.BASE_RETRY_DELAY }),
            takeUntilDestroyed(this.destroyRef),
            catchError(this.handleError<Account | null>('getAccount', null))
        );
    }

    addHistory(betHistory: BetHistory): Observable<number> {
        console.log(`bet history ${JSON.stringify(betHistory)}`);
        return this.http.post<number>(`${this.apiUrl}/saveBetHistory`, betHistory).pipe(
            retry({ count: 1, delay: this.BASE_RETRY_DELAY }),
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

    getAccounts(): Observable<Account[] | null> {
        const url = `${this.apiUrl}/${this.uid()}/getAccounts`;
        console.log(url);
        return this.http.get<Account[]>(url).pipe(
            retry({ count: 3, delay: this.BASE_RETRY_DELAY }),
            takeUntilDestroyed(this.destroyRef),
            catchError(this.handleError<Account[] | null>('getAccounts', null))
        );
    }
}

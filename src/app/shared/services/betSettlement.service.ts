import {computed, DestroyRef, inject, Injectable, signal} from '@angular/core';
import {Game} from "../model/paper-betting/Game";
import {Account} from "../model/paper-betting/Account";
import {firstValueFrom, Observable, of, retry, throwError, timeout, timer} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {BaseApiService} from "./base-api.service";
import {SportType} from "../model/SportType";
import {BetHistory} from "../model/paper-betting/BetHistory";
import {AuthService} from "./auth.service";
import {environment} from "../../../environments/environment";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { Client, messageCallbackType } from '@stomp/stompjs';
import SockJS from "sockjs-client";


// Dynamic WebSocket URL based on environment
const getWebSocketUrl = (): string => {
    const baseUrl = environment.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${baseUrl}/ws`; // Matches Spring Boot STOMP endpoint
};

@Injectable({
    providedIn: 'root'
})
export class BetSettlementService extends BaseApiService<Game> {
    private readonly destroyRef = inject(DestroyRef);
    private readonly auth = inject(AuthService);
    private stompClient: Client | null = null; // STOMP client instance
    protected override apiUrl = environment.apiUrl + '/paper-betting/v1';

    private readonly MAX_API_RETRIES = 3;
    private readonly BASE_RETRY_DELAY = 2000;
    private readonly REQUEST_TIMEOUT = 15000;

    readonly account = signal<Account | null>(null);
    readonly allGames = signal<Game[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly errorMessage = signal<string | null>(null);
    private readonly balance = signal<number>(0);
    private readonly uid = signal<string | null>(null);

    readonly currentUserId = computed(() => this.uid());

    constructor() {
        super();
        this.initializeUser();
    }

    private async initializeUser(retryCount = 0): Promise<void> {
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

            this.uid.set(userId);
            console.log('User initialized with ID:', userId);
            await this.fetchInitialAccount(userId);
            this.setupWebSocket(userId);
            this.isLoading.set(false);
        } catch (error) {
            console.error('Error initializing user:', error);
            this.errorMessage.set('Failed to initialize user');

            if (retryCount < this.MAX_API_RETRIES) {
                this.errorMessage.set(`Retrying initialization (${retryCount + 1}/${this.MAX_API_RETRIES})...`);
                await this.retryInitialize(retryCount);
            } else {
                console.error('Failed to initialize user after max retries');
                this.errorMessage.set('Failed to initialize after multiple attempts. Please refresh the page.');
                this.uid.set(null);
                this.isLoading.set(false);
            }
        }
    }
    private async fetchInitialAccount(userId: string): Promise<void> {
        try {
            const initialAccount = await firstValueFrom(
                this.getAccount(userId).pipe(
                    timeout(this.REQUEST_TIMEOUT),
                    retry({
                        count: 2,
                        delay: (error, retryCount) => {
                            console.log(`Retrying account fetch (${retryCount})...`);
                            return timer(this.BASE_RETRY_DELAY * Math.pow(1.5, retryCount));
                        }
                    }),
                    catchError(error => {
                        console.error('Failed to get initial account:', error);
                        this.errorMessage.set('Could not load account data');
                        return of(null);
                    })
                )
            );

            if (this.isValidAccount(initialAccount)) {
                this.updateAccountState(initialAccount);
                this.errorMessage.set(null);
            }
        } catch (error) {
            console.error('Error fetching initial account:', error);
            this.errorMessage.set('Failed to fetch account data');
        }
    }

    private async retryInitialize(retryCount: number): Promise<void> {
        const delayMs = this.BASE_RETRY_DELAY * Math.pow(1.5, retryCount);
        console.log(`Retry ${retryCount + 1} of ${this.MAX_API_RETRIES} in ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.initializeUser(retryCount + 1);
    }

    // ... (other methods unchanged until setupWebSocket)

    private async setupWebSocket(userId: string): Promise<void> {
        try {
            const token = await this.auth.getFreshToken();
            if (!token) {
                console.error('No token available for WebSocket connection');
                this.errorMessage.set('Authentication error');
                return;
            }

            // Initialize STOMP client with SockJS fallback
            this.stompClient = new Client({
                webSocketFactory: () => new  SockJS(getWebSocketUrl()), // Use default-imported SockJS
                connectHeaders: {
                    Authorization: `Bearer ${token}`,
                    userId: userId // Pass userId in headers if needed by backend
                },
                reconnectDelay: 2000, // Reconnect after 2 seconds
                heartbeatIncoming: 4000, // Server heartbeat
                heartbeatOutgoing: 4000, // Client heartbeat
                onConnect: () => {
                    console.log('STOMP WebSocket connected for user:', userId);
                    this.errorMessage.set(null);
                    this.subscribeToUpdates(userId);
                },
                onStompError: (frame) => {
                    console.error('STOMP error:', frame);
                    this.errorMessage.set('Failed to connect to live updates');
                },
                onWebSocketClose: (event) => {
                    console.log('STOMP WebSocket disconnected:', event.reason);
                    this.errorMessage.set('Lost connection to live updates');
                }
            });

            // Optional: Enable debug logging
            // this.stompClient.debug = (str) => console.log(str);

            // Activate the STOMP client
            this.stompClient.activate();

            // Clean up on service destruction
            this.destroyRef.onDestroy(() => {
                if (this.stompClient) {
                    this.stompClient.deactivate();
                    console.log('STOMP WebSocket disconnected due to service destruction');
                }
            });
        } catch (error) {
            console.error('Failed to setup STOMP WebSocket:', error);
            this.errorMessage.set('WebSocket setup failed');
        }
    }

    private subscribeToUpdates(userId: string): void {
        if (!this.stompClient) return;

        // Subscribe to account updates
        this.stompClient.subscribe(`/topic/accountUpdate/${userId}`, (message) => {
            const account: Account = JSON.parse(message.body);
            console.log('Received account update:', account);
            if (this.isValidAccount(account)) {
                this.updateAccountState(account);
            }
        });

        // Subscribe to game updates
        this.stompClient.subscribe('/topic/gameUpdate', (message) => {
            const game: Game = JSON.parse(message.body);
            console.log('Received game update:', game);
            this.allGames.update(games => {
                const index = games.findIndex(g => g.id === game.id);
                if (index !== -1) {
                    return [...games.slice(0, index), game, ...games.slice(index + 1)];
                }
                return [...games, game];
            });
        });
    }

    // ... (rest of the methods unchanged)

    private isValidAccount(account: Account | null): account is Account {
        return !!account && typeof account.balance === 'number' && Array.isArray(account.betHistory);
    }

    private updateAccountState(account: Account): void {
        this.account.set(account);
        this.balance.set(account.balance);

        if (account.betHistory && account.betHistory.length > 0) {
            const latestBet = account.betHistory[account.betHistory.length - 1];
            if (latestBet?.gameId) {
                this.updateGameBetRecord(latestBet.gameId, latestBet);
            }
        }
    }

    private updateGameBetRecord(gameId: string, betHistory: BetHistory): void {
        this.allGames.update(games => games.map(game =>
            game.id === gameId ? {
                ...game, betSettlement: {
                    betType: betHistory.betType,
                    wagerValue: betHistory.wagerValue,
                    wagerAmount: betHistory.wagerAmount,
                    comment: ''
                }
            } : game
        ));
    }

    addHistory(betHistory: BetHistory): Observable<number> {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        const currentAccount = this.account();
        if (currentAccount && currentAccount.balance >= betHistory.wagerAmount) {
            const newBalance = currentAccount.balance - betHistory.wagerAmount;
            this.balance.set(newBalance);
            this.account.set({
                ...currentAccount,
                balance: newBalance,
                betHistory: [...currentAccount.betHistory, betHistory]
            });
        } else {
            this.errorMessage.set('Insufficient funds');
            this.isLoading.set(false);
            return throwError(() => new Error('Insufficient funds'));
        }

        console.log(`Submitting bet history: ${JSON.stringify(betHistory)}`);
        return this.http.post<number>(`${this.apiUrl}/saveBetHistory`, betHistory).pipe(
            timeout(this.REQUEST_TIMEOUT),
            retry({ count: 1, delay: this.BASE_RETRY_DELAY }),
            takeUntilDestroyed(this.destroyRef),
            map(response => {
                this.isLoading.set(false);
                this.errorMessage.set(null);
                return response;
            }),
            catchError(error => {
                if (currentAccount) {
                    this.balance.set(currentAccount.balance);
                    this.account.set(currentAccount);
                }
                this.isLoading.set(false);
                this.errorMessage.set('Failed to save bet');
                return throwError(() => error);
            })
        );
    }

    getSportsByNFL(sportType: SportType): Observable<Game[]> {
        const userId = this.uid();
        if (!userId) {
            this.errorMessage.set('User not authenticated');
            return of([]);
        }

        this.isLoading.set(true);
        this.errorMessage.set(null);

        return this.http.get<Game[]>(`${this.apiUrl}/${userId}/${sportType}/getUpcomingGames`, {
            withCredentials: true
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            map(games => {
                this.isLoading.set(false);
                this.errorMessage.set(null);
                return this.updateGamesWithBetHistory(games);
            }),
            retry({
                count: this.MAX_API_RETRIES,
                delay: (error, retryCount) => {
                    console.log(`Retrying game load attempt ${retryCount}`);
                    this.errorMessage.set(`Loading games (retry ${retryCount}/${this.MAX_API_RETRIES})...`);
                    return timer(this.BASE_RETRY_DELAY * Math.pow(1.5, retryCount));
                }
            }),
            takeUntilDestroyed(this.destroyRef),
            catchError(error => {
                console.error('Error fetching games:', error);
                this.isLoading.set(false);
                this.errorMessage.set('Failed to load games. Please try again.');
                return of([]);
            })
        );
    }

    private updateGamesWithBetHistory(games: Game[]): Game[] {
        const betHistory = this.account()?.betHistory;
        if (!betHistory) return games;

        const updatedGames = games.map(game => {
            const betRecord = betHistory.find(bet => bet.gameId === game.id);
            return betRecord ? {
                ...game, betSettlement: {
                    betType: betRecord.betType,
                    wagerValue: betRecord.wagerValue,
                    wagerAmount: betRecord.wagerAmount,
                    comment: ''
                }
            } : game;
        });
        this.allGames.set(updatedGames);
        return updatedGames;
    }

    getAccount(uid: string): Observable<Account | null> {
        return this.http.get<Account>(`${this.apiUrl}/${uid}/getAccount`, {
            withCredentials: true
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            retry({
                count: this.MAX_API_RETRIES,
                delay: (error, retryCount) => {
                    console.log(`Retrying account fetch attempt ${retryCount}`);
                    return timer(this.BASE_RETRY_DELAY * Math.pow(1.5, retryCount));
                }
            }),
            takeUntilDestroyed(this.destroyRef),
            catchError(error => {
                console.error('Error fetching account:', error);
                return of(null);
            })
        );
    }

    getAccounts(): Observable<Account[] | null> {
        const userId = this.uid();
        if (!userId) return of(null);

        this.isLoading.set(true);

        const url = `${this.apiUrl}/${userId}/getAccounts`;
        console.log(url);

        return this.http.get<Account[]>(url).pipe(
            timeout(this.REQUEST_TIMEOUT),
            retry({
                count: this.MAX_API_RETRIES,
                delay: (error, retryCount) => {
                    console.log(`Retrying accounts fetch attempt ${retryCount}`);
                    return timer(this.BASE_RETRY_DELAY * Math.pow(1.5, retryCount));
                }
            }),
            takeUntilDestroyed(this.destroyRef),
            map(accounts => {
                this.isLoading.set(false);
                return accounts;
            }),
            catchError(error => {
                console.error('Error fetching accounts:', error);
                this.isLoading.set(false);
                this.errorMessage.set('Failed to load accounts');
                return of(null);
            })
        );
    }
}

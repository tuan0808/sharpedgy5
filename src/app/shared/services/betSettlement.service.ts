import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable, of, throwError, timer } from 'rxjs';
import { map, catchError, tap, timeout, retry } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { Game } from '../model/paper-betting/Game';
import { Account } from '../model/paper-betting/Account';
import { SportType } from '../model/SportType';
import { PaperBetRecord } from '../model/paper-betting/PaperBetRecord';
import { BaseService } from './base.service';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { Credit } from '../model/paper-betting/Credit';

interface OptimisticBet {
    tempId: string;
    paperBetRecord: PaperBetRecord;
    timestamp: number;
    status: 'pending' | 'confirmed' | 'failed';
    originalBalance?: number;
}

export interface PagedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
}

const getWebSocketUrl = (): string => {
    const baseUrl = environment.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${baseUrl}/ws`;
};

@Injectable({
    providedIn: 'root'
})
export class BetSettlementService extends BaseService<Account> {
    protected override apiUrl = `${environment.apiUrl}/paper-betting/v1`;

    // Core state
    readonly account = signal<Account | null>(null);
    readonly allGames = signal<Game[]>([]);
    readonly balance = signal<number>(0);
    readonly credit = signal<Credit | null>(null);
    readonly currentUserId = computed(() => this.userId());

    // Optimistic update state
    private optimisticBets = signal<Map<string, OptimisticBet>>(new Map());
    readonly pendingBetsCount = computed(() => {
        const bets = this.optimisticBets();
        return Array.from(bets.values()).filter(bet => bet.status === 'pending').length;
    });

    private stompClient: Client | null = null;
    private readonly SERVER_TIMEOUT = 10000; // 10 seconds
    private readonly RETRY_ATTEMPTS = 2;

    constructor() {
        super();
        this.initializeAccount();
    }

    private async initializeAccount(): Promise<void> {
        const userId = await this.initializeUser();
        if (!userId) {
            console.error('Failed to initialize user ID');
            this.errorMessage.set('User authentication failed');
            return;
        }
        console.log('Initializing account for user:', userId);
        await this.fetchInitialAccount(userId);
        await this.fetchInitialCredit(userId);
        await this.setupWebSocket(userId);
    }

    private async fetchInitialAccount(userId: string): Promise<void> {
        try {
            const initialAccount = await firstValueFrom(
                this.get<Account | null>(`${this.apiUrl}/${userId}/getAccount`, 'Could not load account data')
            );
            if (this.isValidAccount(initialAccount)) {
                this.updateAccountState(initialAccount);
            }
        } catch (error) {
            console.error('Error fetching initial account:', error);
            this.errorMessage.set('Failed to load account');
        }
    }

    private async fetchInitialCredit(userId: string): Promise<void> {
        try {
            const credit = await firstValueFrom(
                this.get<Credit>(`${this.apiUrl}/${userId}/getCreditByUUID`, 'Failed to load credit')
            );
            console.log('Fetched initial credit:', credit);
            this.credit.set(credit);
        } catch (error) {
            console.error('Error fetching initial credit:', error);
            this.credit.set(null);
            this.errorMessage.set('Failed to load credit');
        }
    }

    private async setupWebSocket(userId: string): Promise<void> {
        try {
            const token = await this.auth.getFreshToken();
            if (!token) {
                console.error('No token available for WebSocket connection');
                this.errorMessage.set('Authentication error');
                return;
            }

            this.stompClient = new Client({
                webSocketFactory: () => new SockJS(getWebSocketUrl()),
                connectHeaders: {
                    Authorization: `Bearer ${token}`,
                    userId: userId
                },
                reconnectDelay: 2000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
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

            this.stompClient.activate();

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

        this.stompClient.subscribe(`/topic/accountUpdate/${userId}`, (message) => {
            const account: Account = JSON.parse(message.body);
            console.log('Received account update:', account);
            if (this.isValidAccount(account)) {
                this.updateAccountState(account);
                this.reconcileOptimisticBets(account);
            }
        });

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

        this.stompClient.subscribe(`/topic/creditUpdate/${userId}`, (message) => {
            const credit: Credit = JSON.parse(message.body);
            console.log('Received credit update:', credit);
            this.credit.set(credit);
        });
    }

    // OPTIMISTIC UPDATE METHODS

    /**
     * Add optimistic bet to local state
     */
    addOptimisticBet(tempId: string, paperBetRecord: PaperBetRecord): void {
        const currentBalance = this.balance();
        const optimisticBet: OptimisticBet = {
            tempId,
            paperBetRecord: { ...paperBetRecord },
            timestamp: Date.now(),
            status: 'pending',
            originalBalance: currentBalance
        };

        this.optimisticBets.update(bets => {
            const newBets = new Map(bets);
            newBets.set(tempId, optimisticBet);
            return newBets;
        });

        // Update balance optimistically
        this.balance.set(currentBalance - paperBetRecord.wagerAmount);

        // Set up timeout to handle stuck optimistic updates
        this.setupOptimisticTimeout(tempId);
    }

    /**
     * Set up timeout handling for optimistic bets
     */
    private setupOptimisticTimeout(tempId: string): void {
        // Failure timeout - rollback if not confirmed within timeout
        timer(this.SERVER_TIMEOUT).subscribe(() => {
            const bet = this.optimisticBets().get(tempId);
            if (bet && bet.status === 'pending') {
                console.error(`Optimistic bet ${tempId} timed out`);
                this.rollbackOptimisticBet(tempId);
            }
        });
    }

    /**
     * Confirm optimistic bet with server data
     */
    confirmOptimisticBet(tempId: string, serverResult: any): void {
        this.optimisticBets.update(bets => {
            const newBets = new Map(bets);
            const bet = newBets.get(tempId);
            if (bet) {
                bet.status = 'confirmed';
                newBets.set(tempId, bet);
            }
            return newBets;
        });

        // Clean up after confirmation
        setTimeout(() => this.cleanupOptimisticBet(tempId), 2000);
    }

    /**
     * Rollback optimistic bet
     */
    rollbackOptimisticBet(tempId: string): void {
        const bet = this.optimisticBets().get(tempId);
        if (bet && bet.originalBalance !== undefined) {
            // Restore original balance
            this.balance.set(bet.originalBalance);

            // Mark as failed
            this.optimisticBets.update(bets => {
                const newBets = new Map(bets);
                const failedBet = newBets.get(tempId);
                if (failedBet) {
                    failedBet.status = 'failed';
                    newBets.set(tempId, failedBet);
                }
                return newBets;
            });

            // Clean up after rollback
            setTimeout(() => this.cleanupOptimisticBet(tempId), 3000);
        }
    }

    /**
     * Clean up optimistic bet state
     */
    private cleanupOptimisticBet(tempId: string): void {
        this.optimisticBets.update(bets => {
            const newBets = new Map(bets);
            newBets.delete(tempId);
            return newBets;
        });
    }

    /**
     * Reconcile optimistic state with server updates
     */
    private reconcileOptimisticBets(serverAccount: Account): void {
        const optimisticBets = this.optimisticBets();
        const serverBetHistory = serverAccount.betHistory || [];

        optimisticBets.forEach((optimisticBet, tempId) => {
            if (optimisticBet.status === 'pending') {
                // Check if this bet now exists on the server
                const matchingServerBet = serverBetHistory.find(bet =>
                    bet.gameId === optimisticBet.paperBetRecord.gameId &&
                    bet.wagerAmount === optimisticBet.paperBetRecord.wagerAmount &&
                    Math.abs(new Date(bet.gameStart).getTime() - optimisticBet.paperBetRecord.gameStart.getTime()) < 1000
                );

                if (matchingServerBet) {
                    this.confirmOptimisticBet(tempId, matchingServerBet);
                }
            }
        });
    }

    /**
     * Enhanced bet submission with optimistic support
     */
    async addRecordOptimistic(paperBetRecord: PaperBetRecord,uid : string, tempId: string): Promise<any> {
        console.log(`Submitting bet with tempId ${tempId}:`, JSON.stringify(paperBetRecord));

        return firstValueFrom(
            this.post<any, PaperBetRecord>(
                `${this.apiUrl}/${uid}/saveBetRecord`,
                paperBetRecord,
                'Failed to save bet'
            ).pipe(
                timeout(this.SERVER_TIMEOUT),
                retry(this.RETRY_ATTEMPTS),
                map(response => {
                    console.log(`Bet confirmed for tempId ${tempId}:`, JSON.stringify(response));
                    return response;
                }),
                catchError(error => {
                    console.error(`Bet failed for tempId ${tempId}:`, error);
                    throw error;
                })
            )
        );
    }

    // EXISTING METHODS (Updated to handle optimistic state)

    private isValidAccount(account: Account | null): account is Account {
        return !!account && typeof account.balance === 'number' && Array.isArray(account.betHistory);
    }

    private updateAccountState(account: Account): void {
        const pendingBets = Array.from(this.optimisticBets().values())
            .filter(bet => bet.status === 'pending');

        this.account.set(account);

        // Only update balance if no pending optimistic bets
        if (pendingBets.length === 0) {
            this.balance.set(account.balance);
        }

        if (account.betHistory && account.betHistory.length > 0) {
            const latestBet = account.betHistory[account.betHistory.length - 1];
            if (latestBet?.gameId) {
                this.updateGameBetRecord(latestBet.gameId, latestBet);
            }
        }
    }

    private updateGameBetRecord(gameId: number, paperBetRecord: PaperBetRecord): void {
        this.allGames.update(games => games.map(game =>
            game.id === gameId ? {
                ...game, betSettlement: {
                    betType: paperBetRecord.betType,
                    wagerValue: paperBetRecord.wagerValue,
                    wagerAmount: paperBetRecord.wagerAmount
                }
            } : { ...game }
        ));
    }

    // BACKWARD COMPATIBILITY - Original addRecord method
    addRecord(paperBetRecord: PaperBetRecord): Observable<any> {
        console.log(`paperBetRecord ${JSON.stringify(paperBetRecord)}`);
        const result = this.post<any, PaperBetRecord>(
            `${this.apiUrl}/saveBetHistory`,
            paperBetRecord,
            'Failed to save bet'
        ).pipe(
            map(response => response),
            catchError(error => {
                const currentAccount = this.account();
                if (currentAccount) {
                    this.balance.set(currentAccount.balance);
                    this.account.set(currentAccount);
                }
                return throwError(() => error);
            })
        );
        result.subscribe(s => console.log(`test ${JSON.stringify(s)}`));
        return result;
    }

    // ALL OTHER EXISTING METHODS REMAIN UNCHANGED
    getSportsByNFL(sportType: SportType): Observable<Game[]> {
        const userId = this.currentUserId();
        if (!userId) {
            this.errorMessage.set('User not authenticated');
            return of([]);
        }

        return this.get<Game[]>(
            `${this.apiUrl}/${userId}/${sportType}/getUpcomingGames`,
            'Failed to load games'
        ).pipe(
            tap(games => console.log('Raw API Games:', games)),
            map(games => this.updateGamesWithBetHistory(games))
        );
    }

    getUpcomingGamesPaginated(uid: string, league: SportType, page: number, resultsPerPage: number): Observable<PagedResponse<Game>> {
        const leagueParam = this.convertSportTypeToLeague(league);
        const params = new HttpParams()
            .set('page', page.toString())
            .set('resultsPerPage', resultsPerPage.toString());

        return this.get<PagedResponse<Game>>(
            `${this.apiUrl}/${uid}/${leagueParam}/getUpcomingGames`,
            'Failed to load paginated games',
            { params }
        ).pipe(
            tap(response => console.log(`Received ${response.content.length} games for ${leagueParam}:`, response)),
            map(response => ({
                ...response,
                content: this.updateGamesWithBetHistory(response.content)
            })),
            catchError(error => {
                console.error(`Error fetching paginated games for ${leagueParam}:`, error);
                throw error;
            })
        );
    }

    private convertSportTypeToLeague(sportType: SportType): string {
        const sportMapping: Record<SportType, string> = {
            [SportType.NFL]: 'NFL', [SportType.NHL]: 'NHL', [SportType.ALL]: 'ALL', [SportType.NBA]: 'NBA',
            [SportType.MLB]: 'MLB', [SportType.MLS]: 'MLS', [SportType.EPL]: 'EPL', [SportType.UFC]: 'UFC',
            [SportType.PGA]: 'PGA', [SportType.WTA]: 'WTA', [SportType.NASCAR]: 'NASCAR',
            [SportType.NCAA_FOOTBALL]: 'NCAAF', [SportType.NCAA_BASKETBALL]: 'NCAAB', [SportType.SOCCER]: 'SOCCER'
        };

        return sportMapping[sportType] || 'NFL';
    }

    private updateGamesWithBetHistory(games: Game[]): Game[] {
        const betHistory = this.account()?.betHistory;
        if (!betHistory) return [...games];

        return games.map(game => {
            const betRecord = betHistory.find(bet => bet.gameId === game.id);
            return betRecord ? {
                ...game, betSettlement: {
                    betType: betRecord.betType,
                    wagerValue: betRecord.wagerValue,
                    wagerAmount: betRecord.wagerAmount
                }
            } : { ...game };
        });
    }

    getAccount(uid: string): Observable<Account | null> {
        return this.get<Account | null>(`${this.apiUrl}/${uid}/getAccount`, 'Error fetching account');
    }

    getAccounts(): Observable<Account[] | null> {
        const userId = this.currentUserId();
        if (!userId) return of(null);
        return this.get<Account[]>(`${this.apiUrl}/${userId}/getAccounts`, 'Failed to load accounts');
    }

    getBalanceById(): Observable<Credit> {
        const userId = this.currentUserId();
        if (!userId) {
            this.errorMessage.set('User not authenticated');
            return throwError(() => new Error('User not authenticated'));
        }
        return this.get<Credit>(`${this.apiUrl}/${userId}/getCreditByUUID`, 'Failed to load credit');
    }
}

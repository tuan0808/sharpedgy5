import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable, of, throwError, timer, Subject } from 'rxjs';
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

// Updated enum to use string values matching server responses
export enum BetResponseState {
    SUCCESS = 'SUCCESS',
    CREDIT_LIMIT_EXCEEDED = 'CREDIT_LIMIT_EXCEEDED',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
    ERROR = 'ERROR'
}

// Interface matching Kotlin BetResult data class with enum
export interface BetResult {
    status: BetResponseState;
    message: string;
    remainingCredit?: number;
    totalCredit?: number;
    balance?: number;
    tempId?: string;
    paperBetRecord?: PaperBetRecord;
}

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

export interface GameUpdate {
    gameId: number;
    betRecord?: PaperBetRecord;
    timestamp: number;
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

    // Use RxJS Subject instead of signals for notifications to avoid circular dependencies
    private gameUpdateSubject = new Subject<GameUpdate>();
    readonly gameUpdate$ = this.gameUpdateSubject.asObservable();

    // Optimistic update state
    private optimisticBets = signal<Map<string, OptimisticBet>>(new Map());
    readonly pendingBetsCount = computed(() => {
        const bets = this.optimisticBets();
        return Array.from(bets.values()).filter(bet => bet.status === 'pending').length;
    });

    private stompClient: Client | null = null;
    private readonly SERVER_TIMEOUT = 10000; // 10 seconds
    private readonly RETRY_ATTEMPTS = 2;
    private isBetProcessing = false;

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

    /**
     * Submit bet and return the actual server BetResult response
     */
    async addRecordOptimistic(paperBetRecord: PaperBetRecord, uid: string, tempId: string): Promise<BetResult> {
        if (this.isBetProcessing) {
            console.log(`Bet already processing, rejecting tempId ${tempId}`);
            return {
                status: BetResponseState.ERROR,
                message: 'A bet is already being processed. Please wait.',
                tempId
            };
        }

        this.isBetProcessing = true;
        console.log(`Submitting bet with tempId ${tempId}:`, paperBetRecord);
        const originalBalance = this.balance();

        this.balance.set(originalBalance - paperBetRecord.wagerAmount);

        try {
            const result = await firstValueFrom(
                this.post<BetResult, PaperBetRecord>(
                    `${this.apiUrl}/${uid}/saveBetRecord`,
                    paperBetRecord,
                    'Failed to save bet'
                ).pipe(
                    timeout(this.SERVER_TIMEOUT),
                    retry(this.RETRY_ATTEMPTS)
                )
            );

            console.log(`Server response for bet ${tempId}:`, result);

            if (result.status === BetResponseState.SUCCESS) {
                if (result.balance !== undefined) {
                    this.balance.set(result.balance);
                }
                if (result.remainingCredit !== undefined && result.totalCredit !== undefined) {
                    this.credit.set({
                        remainingCredit: result.remainingCredit,
                        totalCredit: result.totalCredit,
                        balance: result.balance || this.balance()
                    });
                }
                const betRecord = result.paperBetRecord || paperBetRecord;
                console.log(`Updating game with betRecord:`, betRecord); // Debug log
                this.updateGameWithBet(betRecord.gameId, betRecord);
            } else {
                console.log(`Bet failed with status: ${result.status}`);
                this.balance.set(originalBalance);
            }

            return result;

        } catch (error) {
            console.error(`Network error for bet ${tempId}:`, error);
            this.balance.set(originalBalance);
            return {
                status: BetResponseState.ERROR,
                message: 'Network connection failed. Please check your connection and try again.',
                tempId
            };
        } finally {
            this.isBetProcessing = false;
        }
    }

    /**
     * Update game with bet and notify via RxJS Subject
     */
    public updateGameWithBet(gameId: number, betRecord: PaperBetRecord): void {
        console.log(`Updating game ${gameId} with bet record`);

        // Update the game in allGames
        const currentGames = this.allGames();
        const gameIndex = currentGames.findIndex(g => g.id === gameId);

        if (gameIndex !== -1) {
            const updatedGames = [...currentGames];
            updatedGames[gameIndex] = {
                ...updatedGames[gameIndex],
                betSettlement: {
                    betType: betRecord.betType,
                    selectedTeam: betRecord.selectedTeam,
                    status: betRecord.status,
                    wagerValue: betRecord.wagerValue,
                    wagerAmount: betRecord.wagerAmount
                }
            };

            this.allGames.set(updatedGames);

            // Emit update via Subject (not signal)
            this.gameUpdateSubject.next({
                gameId,
                betRecord,
                timestamp: Date.now()
            });

            console.log(`Game ${gameId} updated and notification sent`);
        }
    }

    /**
     * Public methods for balance/credit updates
     */
    updateBalance(newBalance: number): void {
        this.balance.set(newBalance);
    }

    updateCredit(creditData: { remainingCredit: number; totalCredit: number; balance: number }): void {
        this.credit.set({
            remainingCredit: creditData.remainingCredit,
            totalCredit: creditData.totalCredit,
            balance: creditData.balance
        });
        this.balance.set(creditData.balance);
    }

    // STATUS HELPER METHODS
    isSuccessfulBet(result: BetResult): boolean {
        return result.status === BetResponseState.SUCCESS;
    }

    isCreditError(result: BetResult): boolean {
        return result.status === BetResponseState.CREDIT_LIMIT_EXCEEDED;
    }

    isAccountError(result: BetResult): boolean {
        return result.status === BetResponseState.USER_NOT_FOUND ||
            result.status === BetResponseState.ACCOUNT_NOT_FOUND;
    }

    private isValidAccount(account: Account | null): account is Account {
        return !!account && typeof account.balance === 'number' && Array.isArray(account.betHistory);
    }

    private updateAccountState(account: Account): void {
        this.account.set(account);
        this.balance.set(account.balance);

        if (account.betHistory && account.betHistory.length > 0) {
            const latestBet = account.betHistory[account.betHistory.length - 1];
            if (latestBet?.gameId) {
                this.updateGameWithBet(latestBet.gameId, latestBet);
            }
        }
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
            tap(response => console.log(`Received ${response.content.length} games for ${leagueParam}`)),
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
                    selectedTeam: betRecord.selectedTeam,
                    status: betRecord.status,
                    wagerValue: betRecord.wagerValue,
                    wagerAmount: betRecord.wagerAmount
                }
            } : { ...game };
        });
    }

    async refreshUserData(): Promise<void> {
        const userId = this.currentUserId();
        if (!userId) return;

        try {
            await this.fetchInitialAccount(userId);
            await this.fetchInitialCredit(userId);
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
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

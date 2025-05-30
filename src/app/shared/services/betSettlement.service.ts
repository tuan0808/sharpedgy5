import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Game } from '../model/paper-betting/Game';
import { Account } from '../model/paper-betting/Account';
import { SportType } from '../model/SportType';
import { PaperBetRecord } from '../model/paper-betting/PaperBetRecord';
import { BaseService } from './base.service';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { Credit } from '../model/paper-betting/Credit';

const getWebSocketUrl = (): string => {
    const baseUrl = environment.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${baseUrl}/ws`;
};

@Injectable({
    providedIn: 'root'
})
export class BetSettlementService extends BaseService<Account> {
    protected override apiUrl = `${environment.apiUrl}/paper-betting/v1`;
    readonly account = signal<Account | null>(null);
    readonly allGames = signal<Game[]>([]);
    readonly balance = signal<number>(0);
    readonly credit = signal<Credit | null>(null);
    readonly currentUserId = computed(() => this.userId());

    private stompClient: Client | null = null;

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

    private updateGameBetRecord(gameId: string, paperBetRecord: PaperBetRecord): void {
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

    addRecord(paperBetRecord: PaperBetRecord) {
        const credit = this.credit().remainingCredit
        console.log(`paperBetRecord ${JSON.stringify(paperBetRecord)}`)
        const test = this.post<any, PaperBetRecord>(
            `${this.apiUrl}/saveBetHistory`,
            paperBetRecord,
            'Failed to save bet'
        ).pipe(
            map(response => response),
            catchError(error => {
                if (currentAccount) {
                    this.balance.set(currentAccount.balance);
                    this.account.set(currentAccount);
                }
                return throwError(() => error);
            })
        );
        test.subscribe(s=>console.log(`test ${JSON.stringify(s)}`))
        //console.log(`test ${JSON.stringify(test)}`)

        const currentAccount = this.account();
        //
        // if (currentAccount && currentAccount.balance >= paperBetRecord.wagerAmount) {
        //     const newBalance = currentAccount.balance - paperBetRecord.wagerAmount;
        //     this.balance.set(newBalance);
        //     this.account.set({
        //         ...currentAccount,
        //         balance: newBalance,
        //         betHistory: [...currentAccount.betHistory, paperBetRecord]
        //     });
        // } else {
        //     this.errorMessage.set('Insufficient funds');
        //     this.isLoading.set(false);
        //     return throwError(() => new Error('Insufficient funds'));
        // }
        //
        // console.log(`Submitting paper bet record: ${JSON.stringify(paperBetRecord)}`);
        // return this.post<number, PaperBetRecord>(
        //     `${this.apiUrl}/saveBetHistory`,
        //     paperBetRecord,
        //     'Failed to save bet'
        // ).pipe(
        //     map(response => response),
        //     catchError(error => {
        //         if (currentAccount) {
        //             this.balance.set(currentAccount.balance);
        //             this.account.set(currentAccount);
        //         }
        //         return throwError(() => error);
        //     })
        // );
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

    private updateGamesWithBetHistory(games: Game[]): Game[] {
        const betHistory = this.account()?.betHistory;
        if (!betHistory) {
            console.log('No bet history, returning games as-is');
            this.allGames.set([...games]);
            return [...games];
        }

        const updatedGames = games.map(game => {
            const betRecord = betHistory.find(bet => bet.gameId === game.id);
            return betRecord ? {
                ...game, betSettlement: {
                    betType: betRecord.betType,
                    wagerValue: betRecord.wagerValue,
                    wagerAmount: betRecord.wagerAmount
                }
            } : { ...game };
        });
        console.log('Updating allGames with:', updatedGames);
        this.allGames.set([...updatedGames]);
        return updatedGames;
    }

    getAccount(uid: string): Observable<Account | null> {
        return this.get<Account | null>(
            `${this.apiUrl}/${uid}/getAccount`,
            'Error fetching account'
        );
    }

    getAccounts(): Observable<Account[] | null> {
        const userId = this.currentUserId();
        if (!userId) return of(null);

        return this.get<Account[]>(
            `${this.apiUrl}/${userId}/getAccounts`,
            'Failed to load accounts'
        );
    }

    getBalanceById(): Observable<Credit> {
        const userId = this.currentUserId();
        if (!userId) {
            this.errorMessage.set('User not authenticated');
            return throwError(() => new Error('User not authenticated'));
        }

        return this.get<Credit>(
            `${this.apiUrl}/${userId}/getCreditByUUID`,
            'Failed to load credit'
        );
    }
}

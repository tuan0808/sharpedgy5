import { Component, computed, HostListener, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { GameCardComponent } from './game-card/game-card.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SportType } from '../../../shared/model/SportType';
import { BetSettlementService, PagedResponse } from '../../../shared/services/betSettlement.service';
import { ToastrService } from 'ngx-toastr';
import { Game } from '../../../shared/model/paper-betting/Game';
import { firstValueFrom, of, Subscription } from 'rxjs';
import { catchError, retry, tap, timeout } from 'rxjs/operators';
import { EventStatus } from "../../../shared/model/enums/EventStatus";

interface SportDetail {
    name: string;
    icon: string;
    type: SportType;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    imports: [GameCardComponent, PaginationComponent],
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
    private readonly betSettlement = inject(BetSettlementService);
    private readonly toastr = inject(ToastrService);

    // Constants
    private readonly MAX_RETRIES = 2;
    private readonly TIMEOUT_MS = 10000;
    private readonly RETRY_DELAY = 2000;

    // Subscriptions
    private subscriptions = new Subscription();

    // UI State
    protected readonly isAtTop = signal<boolean>(true);
    protected readonly selectedSport = signal<SportType>(SportType.NFL);
    protected readonly currentPageGames = signal<Game[]>([]);
    protected readonly isLoading = signal<boolean>(false);
    protected readonly hasError = signal<boolean>(false);
    protected readonly errorMessage = signal<string>('');
    protected readonly currentPage = signal<number>(1);
    protected readonly pageSize = signal<number>(10);
    protected readonly totalPages = signal<number>(0);
    protected readonly totalElements = signal<number>(0);

    // Service state - COMPUTED SIGNALS
    protected readonly account = computed(() => this.betSettlement.account());
    protected readonly balance = computed(() => this.betSettlement.balance());
    protected readonly credit = computed(() => this.betSettlement.credit());
    protected readonly isWebSocketConnected = computed(() => this.betSettlement.isWebSocketActive());

    // Computed
    protected readonly displayedGames = computed(() => this.currentPageGames());

    // Configuration
    protected readonly sports = signal<SportDetail[]>([
        { name: 'NFL', icon: '🏈', type: SportType.NFL },
        { name: 'NHL', icon: '🏒', type: SportType.NHL },
        { name: 'MLB', icon: '⚾', type: SportType.MLB },
        { name: 'NBA', icon: '🏀', type: SportType.NBA }
    ]);

    constructor() {
        this.setupGameUpdateSubscription();
    }

    async ngOnInit(): Promise<void> {
        await this.waitForUser();
        await this.loadGames();

        // Show WebSocket connection status
        this.checkWebSocketConnection();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        // Note: Don't disconnect WebSocket here as the service is singleton
        // It should stay connected for the app lifetime
    }

    @HostListener('window:scroll')
    onWindowScroll(): void {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const wasAtTop = this.isAtTop();
        const nowAtTop = scrollTop <= 10;

        this.isAtTop.set(nowAtTop);

        if (wasAtTop && !nowAtTop) {
            this.toastr.info('Scroll back to top to see all options', 'Scrolled Down');
        }
    }

    // ================================
    // EVENT HANDLERS
    // ================================

    async onSportSelect(type: SportType): Promise<void> {
        if (this.selectedSport() === type && this.currentPageGames().length > 0 && !this.hasError()) {
            return;
        }

        this.selectedSport.set(type);
        this.currentPage.set(1);
        this.clearGameState();
        await this.loadGames();

        if (this.currentPageGames().length > 0) {
            this.toastr.info(`Loaded ${SportType[type]} games`, 'Sport Changed');
        }
    }

    async onPageChange(page: number): Promise<void> {
        const validPage = Math.max(1, Math.min(page, this.totalPages()));
        if (this.currentPage() !== validPage) {
            this.currentPage.set(validPage);
            await this.loadGames();
        }
    }

    async onPageSizeChange(size: number): Promise<void> {
        this.pageSize.set(size);
        this.currentPage.set(1);
        await this.loadGames();
    }

    async onRetry(): Promise<void> {
        await this.loadGames();
    }

    scrollToTop(): void {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ================================
    // WEBSOCKET CONNECTION CHECK
    // ================================

    private checkWebSocketConnection(): void {
        setTimeout(() => {
            if (!this.isWebSocketConnected()) {
                this.toastr.warning(
                    'Real-time updates may be delayed',
                    'Connection Issue',
                    { timeOut: 5000 }
                );
            } else {
                console.log('WebSocket connected successfully');
            }
        }, 2000); // Give WebSocket 2 seconds to connect
    }

    // ================================
    // SETUP METHODS
    // ================================

    private setupGameUpdateSubscription(): void {
        const gameUpdateSub = this.betSettlement.gameUpdate$.subscribe(update => {
            console.log('Received game update:', update);

            // Update the current page games
            const currentGames = this.currentPageGames();
            const gameIndex = currentGames.findIndex(g => g.id === update.gameId);

            if (gameIndex !== -1) {
                // Get the updated game from the service's allGames
                const allGames = this.betSettlement.allGames();
                const updatedGame = allGames.find(g => g.id === update.gameId);

                if (updatedGame) {
                    // CRITICAL: Create a completely new array with a new game object reference
                    // This ensures Angular detects the change
                    const newGames = currentGames.map((game, index) =>
                        index === gameIndex ? { ...updatedGame } : game
                    );

                    this.currentPageGames.set(newGames);

                    console.log(`Updated game ${update.gameId} in currentPageGames`, updatedGame.betSettlement);

                    // Show appropriate toast notification based on bet status
                    if (updatedGame.betSettlement) {
                        this.showBetSettlementNotification(updatedGame);
                    }
                }
            } else {
                console.log(`Game ${update.gameId} not found in current page, might be on different page`);
            }

            // If a bet record is included, it's a new bet placement
            if (update.betRecord) {
                this.toastr.success(
                    `Bet confirmed: ${update.betRecord.wagerAmount} on ${update.betRecord.selectedTeam}`,
                    'Bet Placed'
                );
            }
        });

        this.subscriptions.add(gameUpdateSub);
    }

    private showBetSettlementNotification(game: Game): void {
        const settlement = game.betSettlement;
        if (!settlement) return;

        const matchup = `${game.homeTeam.abbreviation} vs ${game.awayTeam.abbreviation}`;

        switch (settlement.status) {
            case EventStatus.WIN:
                this.toastr.success(
                    `Congrats! Your bet on ${matchup} won!`,
                    'Bet Won',
                    {
                        timeOut: 7000,
                        progressBar: true,
                        closeButton: true
                    }
                );
                break;

            case EventStatus.LOSS:
                this.toastr.info(
                    `Your bet on ${matchup} didn't win this time`,
                    'Bet Settled',
                    {
                        timeOut: 5000,
                        progressBar: true
                    }
                );
                break;

            case EventStatus.PUSH:
                this.toastr.info(
                    `Your bet on ${matchup} was a push - wager refunded`,
                    'Bet Push',
                    {
                        timeOut: 5000
                    }
                );
                break;

            case EventStatus.CANCELLED:
                this.toastr.warning(
                    `Your bet on ${matchup} was cancelled - wager refunded`,
                    'Bet Cancelled',
                    {
                        timeOut: 5000
                    }
                );
                break;
        }
    }

    // ================================
    // CORE LOGIC
    // ================================

    private async waitForUser(): Promise<void> {
        const maxRetries = 3;
        let retryCount = 0;

        while (!this.betSettlement.currentUserId() && retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
        }

        if (!this.betSettlement.currentUserId()) {
            throw new Error('Failed to authenticate user');
        }
    }

    private async loadGames(): Promise<void> {
        const userId = this.betSettlement.currentUserId();
        if (this.isLoading() || !userId) return;

        try {
            this.setLoadingState(true);

            const pageIndex = this.currentPage() - 1;
            const sport = this.selectedSport();

            const response = await firstValueFrom(
                this.betSettlement.getUpcomingGamesPaginated(userId, sport, pageIndex, this.pageSize())
                    .pipe(
                        timeout(this.TIMEOUT_MS),
                        retry({
                            count: this.MAX_RETRIES,
                            delay: () => new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY))
                        }),
                        tap(response => console.log(`Loaded ${response.content.length} ${SportType[sport]} games`)),
                        catchError(error => {
                            console.error(`Failed to load ${SportType[sport]} games:`, error);
                            this.handleError(error);
                            return of(this.createEmptyResponse(pageIndex));
                        })
                    )
            );

            this.updateGameState(response);
            this.syncGamesToService(response.content);

            if (response.totalElements === 0) {
                this.toastr.info(`No ${SportType[sport]} games available at the moment`, 'No Games');
            }

        } catch (error) {
            this.handleError(error);
            this.currentPageGames.set([]);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Sync loaded games to the service's allGames signal
     */
    private syncGamesToService(games: Game[]): void {
        if (games.length === 0) return;

        const currentAllGames = this.betSettlement.allGames();
        const updatedGames = [...currentAllGames];

        games.forEach(newGame => {
            const existingIndex = updatedGames.findIndex(g => g.id === newGame.id);
            if (existingIndex !== -1) {
                // Preserve bet information if it exists in the current game
                const existingGame = updatedGames[existingIndex];
                if (existingGame.betSettlement && !newGame.betSettlement) {
                    newGame.betSettlement = existingGame.betSettlement;
                }
                updatedGames[existingIndex] = newGame;
            } else {
                updatedGames.push(newGame);
            }
        });

        this.betSettlement.allGames.set(updatedGames);
        console.log(`Synced ${games.length} games to service`);
    }

    // ================================
    // HELPER METHODS
    // ================================

    private setLoadingState(loading: boolean): void {
        this.isLoading.set(loading);
        if (loading) {
            this.hasError.set(false);
            this.errorMessage.set('');
        }
    }

    private updateGameState(response: PagedResponse<Game>): void {
        this.currentPageGames.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
    }

    private handleError(error: any): void {
        this.hasError.set(true);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        this.errorMessage.set(message);
        this.toastr.error(message, 'Error');
    }

    private clearGameState(): void {
        this.currentPageGames.set([]);
        this.hasError.set(false);
        this.errorMessage.set('');
    }

    private createEmptyResponse(pageIndex: number): PagedResponse<Game> {
        return {
            content: [],
            totalPages: 0,
            totalElements: 0,
            size: this.pageSize(),
            number: pageIndex,
            numberOfElements: 0,
            first: true,
            last: true
        };
    }

    protected readonly Math = Math;
}

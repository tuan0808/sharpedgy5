import {Component, computed, HostListener, inject, signal} from '@angular/core';
import { FormsModule } from "@angular/forms";
import { Game } from "../../../shared/model/paper-betting/Game";
import { SportType } from "../../../shared/model/SportType";
import {firstValueFrom, of, Subscription} from "rxjs";
import {catchError, retry, tap, timeout} from "rxjs/operators";
import {SportDetail} from "../../../shared/model/SportDetail";
import {PaginationComponent} from "../../../shared/components/pagination/pagination.component";
import {PredictionCardComponent} from "./prediction-card/prediction-card.component";
import {ToastrService} from "ngx-toastr";
import {PredictionsService} from "../../../shared/services/predictions.service";
import {PagedResponse} from "../../../shared/model/PagedResponse";

@Component({
  selector: 'app-prediction',
  imports: [
    FormsModule,
    PaginationComponent,
    PredictionCardComponent,
  ],
  templateUrl: './prediction.component.html',
  styleUrl: './prediction.component.scss'
})
export class PredictionComponent {
  private readonly toastr = inject(ToastrService);
  private readonly predictionService = inject(PredictionsService);

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
  protected readonly isWebSocketConnected = computed(() => this.predictionService.isWebSocketActive());

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

    // Show WebSocket connection status (will be false for predictions)
    this.checkWebSocketConnection();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
        // For predictions, this will always be false - that's expected
        console.log('Predictions service does not use WebSocket (this is normal)');
      } else {
        console.log('WebSocket connected successfully');
      }
    }, 2000);
  }

  // ================================
  // SETUP METHODS
  // ================================

  private setupGameUpdateSubscription(): void {
    const gameUpdateSub = this.predictionService.gameUpdate$.subscribe(update => {
      console.log(`Game update received for gameId: ${update.gameId}`);

      // Update the current page games
      const currentGames = this.currentPageGames();
      const gameIndex = currentGames.findIndex(g => g.id === update.gameId);

      if (gameIndex !== -1) {
        // Get the updated game from the service's allGames
        const allGames = this.predictionService.allGames();
        const updatedGame = allGames.find(g => g.id === update.gameId);

        if (updatedGame) {
          // Create a new array with the updated game
          const newGames = currentGames.map((game, index) =>
              index === gameIndex ? { ...updatedGame } : game
          );

          this.currentPageGames.set(newGames);
          console.log(`Updated game ${update.gameId} in currentPageGa`)
        }
      } else {
        console.log(`Game ${update.gameId} not found on current page`);
      }
    });

    this.subscriptions.add(gameUpdateSub);
  }

  private showPredictionNotification(game: Game): void {
    const matchup = `${game.homeTeam.abbreviation} vs ${game.awayTeam.abbreviation}`;
    this.toastr.success(
        `Prediction submitted for ${matchup}`,
        'Prediction Saved',
        {
          timeOut: 3000,
          progressBar: true
        }
    );
  }

  // ================================
  // CORE LOGIC
  // ================================

  private async waitForUser(): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    while (!this.predictionService.currentUserId() && retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      retryCount++;
    }

    if (!this.predictionService.currentUserId()) {
      throw new Error('Failed to authenticate user');
    }
  }

  private async loadGames(): Promise<void> {
    const userId = this.predictionService.currentUserId();
    if (this.isLoading() || !userId) return;

    try {
      this.setLoadingState(true);

      const pageIndex = this.currentPage() - 1;
      const sport = this.selectedSport();

      const response = await firstValueFrom(
          this.predictionService.getUpcomingGamesPaginated(userId, sport, pageIndex, this.pageSize())
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

import { Component, inject, Inject, PLATFORM_ID, signal, computed, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {GameService} from "../../../shared/services/game.service";
import {SportType} from "../../../shared/model/SportType";
import {Game} from "../../../shared/model/paper-betting/Game";

export class BreakpointState {
  isMobile: boolean = false;
  isTablet: boolean = false;
  isDesktop: boolean = true;
  screenWidth: number = 1920;
  orientation: 'portrait' | 'landscape' = 'landscape';
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
  RESCHEDULED = 'rescheduled',
  SUSPENDED = 'suspended',
  RESUMED = 'resumed',
  COMPLETED = 'completed'
}

export interface NotificationGame {
  id: string;
  sportType: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  scheduledTime: string;
  homeRecord: string;
  awayRecord: string;
  status: EventStatus;
}

interface PointSpreadPreferences {
  threshold: number;
  alertOnIncrease: boolean;
  alertOnDecrease: boolean;
  minimumGameTime: string;
}

interface BettingVolumeSpikePreferences {
  volumeThreshold: number;
  timeWindow: string;
}

interface ScoreUpdatePreferences {
  incrementThreshold: number;
  realTimeUpdates: boolean;
  onlySignificantScores: boolean;
  quarterEnd: boolean;
  halfTime: boolean;
  periodEnd: boolean;
  overtime: boolean;
  twoMinuteWarning: boolean;
}

interface MoneyLinePreferences {
  threshold: number;
  trackFavoriteShift: boolean;
  trackUnderdogShift: boolean;
  minimumOddsValue: number;
}

interface OverUnderPreferences {
  threshold: number;
  alertOnIncrease: boolean;
  alertOnDecrease: boolean;
}

interface GameStartEndPreferences {
  gameStart: boolean;
  gameEnd: boolean;
  includeStats: boolean;
  preGameReminder: string | null;
  finalScoreDelay: string | null;
}

@Component({
  selector: 'app-create-notification',
  imports: [
    FormsModule
  ],
  templateUrl: './create-notification.component.html',
  styleUrl: './create-notification.component.scss'
})
export class CreateNotificationComponent {
  private readonly gameService = inject(GameService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Signal-based state management (Angular 19 best practice)
  readonly upcomingGames = signal<NotificationGame[]>([]);
  readonly activeGames = signal<NotificationGame[]>([]);
  readonly isLoadingUpcoming = signal<boolean>(false);
  readonly isLoadingActive = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Computed signal for checking if any data is loading
  readonly isLoading = computed(() =>
      this.isLoadingUpcoming() || this.isLoadingActive()
  );

   breakpoint: BreakpointState = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    orientation: 'landscape'
  };

  // Step management
  currentStep = 1;
  totalSteps = 2;

  // Form mode and state
  mode: 'create' | 'edit' = 'create';
  editingNotificationId?: number;
  preselectedGameId?: string;
  activeTab = 'upcoming';
  selectedGames: NotificationGame[] = [];
  selectedNotificationType = 'Point Spread Diff';
  notificationSettings = {
    sensitivity: 'medium',
    gameHoursOnly: false,
    enableImmediately: true,
    autoDisable: false
  };
  typeSpecificPreferences: PointSpreadPreferences | BettingVolumeSpikePreferences | ScoreUpdatePreferences | MoneyLinePreferences | OverUnderPreferences | GameStartEndPreferences;

  notificationTypes = [
    'Point Spread Diff',
    'Betting Volume Spike',
    'Score Update',
    'Moneyline Odds',
    'Over/Under',
    'Game Start/End'
  ];

  darkMode = false;

  // Configuration for backend calls
  private readonly userId = 'current-user-id'; // TODO: Get from auth service
  private readonly defaultLeague = SportType.ALL;
  private readonly defaultPage = 0;
  private readonly defaultResultsPerPage = 50;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Initialize typeSpecificPreferences based on default notification type
    this.typeSpecificPreferences = this.getDefaultPreferences('Point Spread Diff');
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectDevice();
    }
    this.initializeFromRoute();
    this.loadGames();
  }

  /**
   * Load games from backend using Angular 19 patterns
   */
  private loadGames(): void {
    this.loadUpcomingGames();
    this.loadActiveGames();
  }

  /**
   * Load upcoming games from backend
   */
  private loadUpcomingGames(): void {
    this.isLoadingUpcoming.set(true);
    this.errorMessage.set(null);

    this.gameService.getUpcomingGamesPaginated(
        this.userId,
        this.defaultLeague,
        this.defaultPage,
        this.defaultResultsPerPage
    )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const games = response.content.map(game => this.mapGameToNotificationGame(game, EventStatus.UPCOMING));
            this.upcomingGames.set(games);
            this.isLoadingUpcoming.set(false);
          },
          error: (error) => {
            console.error('Error loading upcoming games:', error);
            this.errorMessage.set('Failed to load upcoming games. Please try again.');
            this.isLoadingUpcoming.set(false);
            // Set empty array on error
            this.upcomingGames.set([]);
          }
        });
  }

  /**
   * Load active/live games from backend
   */
  private loadActiveGames(): void {
    this.isLoadingActive.set(true);

    this.gameService.getLiveGamesPaginated(
        this.userId,
        this.defaultLeague,
        this.defaultPage,
        this.defaultResultsPerPage
    )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const games = response.content.map(game => this.mapGameToNotificationGame(game, EventStatus.LIVE));
            this.activeGames.set(games);
            this.isLoadingActive.set(false);
          },
          error: (error) => {
            console.error('Error loading active games:', error);
            this.isLoadingActive.set(false);
            // Set empty array on error
            this.activeGames.set([]);
          }
        });
  }

  /**
   * Map backend Game model to NotificationGame
   */
  private mapGameToNotificationGame(game: Game, defaultStatus: EventStatus): NotificationGame {
    return {
      id: game.id?.toString() || '',
      sportType: game.sportType || 'N/A',
      homeTeam: game.homeTeamAbbr || game.homeTeam || 'HOME',
      awayTeam: game.awayTeamAbbr || game.awayTeam || 'AWAY',
      homeScore: game.homeScore?.toString() || '',
      awayScore: game.awayScore?.toString() || '',
      scheduledTime: this.formatGameTime(game.commenceTime),
      homeRecord: game.homeRecord || '',
      awayRecord: game.awayRecord || '',
      status: this.mapGameStatus(game) || defaultStatus
    };
  }

  /**
   * Map backend game status to EventStatus
   */
  private mapGameStatus(game: Game): EventStatus | undefined {
    // Adjust based on your Game model's status field
    if (game.completed) return EventStatus.COMPLETED;
    if (game.inProgress) return EventStatus.LIVE;
    if (game.upcoming) return EventStatus.UPCOMING;
    return undefined;
  }

  /**
   * Format game commence time for display
   */
  private formatGameTime(commenceTime?: string | Date): string {
    if (!commenceTime) return 'TBD';

    const date = typeof commenceTime === 'string' ? new Date(commenceTime) : commenceTime;

    if (isNaN(date.getTime())) return 'TBD';

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes} ${ampm} ET`;
  }

  private initializeFromRoute(): void {
    this.route.queryParams
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(params => {
          if (params['edit'] && params['id']) {
            this.mode = 'edit';
            this.editingNotificationId = parseInt(params['id']);
            this.loadExistingNotification(this.editingNotificationId);
          } else if (params['gameId']) {
            this.mode = 'create';
            this.preselectedGameId = params['gameId'];
            this.preselectGame(params['gameId']);
          } else {
            this.mode = 'create';
            this.currentStep = 1;
          }
        });
  }

  private preselectGame(gameId: string): void {
    // Wait for games to load before preselecting
    const checkGames = () => {
      const allGames = [...this.upcomingGames(), ...this.activeGames()];
      const game = allGames.find(g => g.id === gameId);

      if (game) {
        this.selectedGames = [game];
        this.currentStep = 2;
        this.activeTab = game.status === EventStatus.LIVE ? 'live' : 'upcoming';
      } else if (this.isLoading()) {
        // Games are still loading, check again after a short delay
        setTimeout(checkGames, 100);
      }
    };

    checkGames();
  }

  private loadExistingNotification(notificationId: number): void {
    // TODO: Implement loading from actual backend service
    // Simulate loading from a service
    const existingNotifications = [
      {
        id: 1,
        type: 'Point Spread Diff',
        gameId: 'lal-gsw-20241125',
        homeTeam: 'Lakers',
        preferences: {
          threshold: 2.5,
          alertOnIncrease: true,
          alertOnDecrease: true,
          minimumGameTime: '30_MINUTES_BEFORE'
        }
      }
    ];
    const notification = existingNotifications.find(n => n.id === notificationId);
    if (notification) {
      this.selectedNotificationType = notification.type;
      this.typeSpecificPreferences = this.getDefaultPreferences(notification.type);
      Object.assign(this.typeSpecificPreferences, notification.preferences);
      const game = [...this.upcomingGames(), ...this.activeGames()].find(g => g.id === notification.gameId);
      if (game) {
        this.selectedGames = [game];
      }
      this.currentStep = 2;
    }
  }

  private detectDevice(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    const isSmallScreen = screenWidth <= 768;

    this.breakpoint = {
      isMobile: isMobileDevice || (isTouchDevice && isSmallScreen),
      isTablet: screenWidth > 768 && screenWidth <= 1024 && isTouchDevice,
      isDesktop: screenWidth > 1024 && !isTouchDevice,
      screenWidth,
      orientation: screenWidth > screenHeight ? 'landscape' : 'portrait'
    };

    if (this.breakpoint.isMobile) {
      document.body.classList.add('mobile-device');
      if (/ipad|iphone|ipod/.test(userAgent)) {
        document.body.classList.add('ios-device');
      }
    }
  }

  // Initialize preferences based on notification type
  private getDefaultPreferences(type: string): PointSpreadPreferences | BettingVolumeSpikePreferences | ScoreUpdatePreferences | MoneyLinePreferences | OverUnderPreferences | GameStartEndPreferences {
    switch (type) {
      case 'Point Spread Diff':
        return { threshold: 2.5, alertOnIncrease: true, alertOnDecrease: true, minimumGameTime: '30_MINUTES_BEFORE' };
      case 'Betting Volume Spike':
        return { volumeThreshold: 200.0, timeWindow: '15_MINUTES' };
      case 'Score Update':
        return { incrementThreshold: 7, realTimeUpdates: true, onlySignificantScores: false, quarterEnd: false, halfTime: false, periodEnd: false, overtime: true, twoMinuteWarning: false };
      case 'Moneyline Odds':
        return { threshold: 15.0, trackFavoriteShift: true, trackUnderdogShift: true, minimumOddsValue: 100.0 };
      case 'Over/Under':
        return { threshold: 1.5, alertOnIncrease: true, alertOnDecrease: true };
      case 'Game Start/End':
        return { gameStart: true, gameEnd: true, includeStats: false, preGameReminder: null, finalScoreDelay: null };
      default:
        return { threshold: 2.5, alertOnIncrease: true, alertOnDecrease: true, minimumGameTime: '30_MINUTES_BEFORE' };
    }
  }

  // Update typeSpecificPreferences when notification type changes
  onNotificationTypeChange(): void {
    this.typeSpecificPreferences = this.getDefaultPreferences(this.selectedNotificationType);
  }

  // Navigation methods
  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/notifications/home']);
    }
  }

  cancel(): void {
    this.router.navigate(['/notifications/home']);
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.selectedGames.length === 0) {
      console.warn('Please select at least one game');
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  // Get page title based on mode
  getPageTitle(): string {
    if (this.mode === 'edit') {
      return 'Edit Notification';
    }
    if (this.preselectedGameId) {
      const game = this.selectedGames[0];
      return game ? `Create Notification for ${game.awayTeam} @ ${game.homeTeam}` : 'Create Notification';
    }
    return 'Create Game Notifications';
  }

  getPageSubtitle(): string {
    if (this.mode === 'edit') {
      return 'Modify your existing notification settings';
    }
    if (this.preselectedGameId) {
      return 'Configure your notification preferences for this game';
    }
    return `Step ${this.currentStep} of ${this.totalSteps}`;
  }

  // Check if we should show game selection step
  shouldShowGameSelection(): boolean {
    return this.currentStep === 1 && !this.preselectedGameId;
  }

  // Check if we should show settings step
  shouldShowSettings(): boolean {
    return this.currentStep === 2 || this.preselectedGameId != null || this.mode === 'edit';
  }

  // Game selection methods
  isGameSelected(gameId: string): boolean {
    return this.selectedGames.some(game => game.id === gameId);
  }

  toggleGameSelection(game: NotificationGame): void {
    if (this.isGameSelected(game.id)) {
      this.selectedGames = this.selectedGames.filter(g => g.id !== game.id);
    } else {
      this.selectedGames = [...this.selectedGames, game];
    }
  }

  removeSelectedGame(game: NotificationGame): void {
    this.selectedGames = this.selectedGames.filter(g => g.id !== game.id);
  }

  // Form submission
  createNotifications(): void {
    if (this.mode === 'edit') {
      this.updateNotification();
    } else {
      this.createNewNotifications();
    }
  }

  private createNewNotifications(): void {
    console.log('Creating notifications:', {
      games: this.selectedGames,
      type: this.selectedNotificationType,
      commonSettings: this.notificationSettings,
      typeSpecificSettings: this.typeSpecificPreferences
    });

    // TODO: Call backend service to create notifications

    const message = `${this.selectedGames.length} notification${this.selectedGames.length !== 1 ? 's' : ''} created successfully!`;
    this.navigateBackWithMessage(message);
  }

  private updateNotification(): void {
    console.log('Updating notification:', {
      id: this.editingNotificationId,
      games: this.selectedGames,
      type: this.selectedNotificationType,
      commonSettings: this.notificationSettings,
      typeSpecificSettings: this.typeSpecificPreferences
    });

    // TODO: Call backend service to update notification

    const message = 'Notification updated successfully!';
    this.navigateBackWithMessage(message);
  }

  private navigateBackWithMessage(message: string): void {
    this.router.navigate(['/notifications/home'], {
      queryParams: { message }
    });
  }

  // Utility methods
  getSafeAreaTop(): string {
    if (isPlatformBrowser(this.platformId) && document.body.classList.contains('ios-device')) {
      return 'env(safe-area-inset-top, 0px)';
    }
    return '0px';
  }

  getSafeAreaBottom(): string {
    if (isPlatformBrowser(this.platformId) && document.body.classList.contains('ios-device')) {
      return 'env(safe-area-inset-bottom, 0px)';
    }
    return '0px';
  }

  /**
   * Refresh games from backend
   */
  refreshGames(): void {
    this.loadGames();
  }
}

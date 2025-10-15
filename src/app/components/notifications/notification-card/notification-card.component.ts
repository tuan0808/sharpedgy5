import { Component, inject, Inject, PLATFORM_ID, signal, computed, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { Page } from "../../../shared/model/notifications/Page";
import {SportType} from "../../../shared/model/SportType";
import {NotificationService} from "../../../shared/services/notification.service";
import {Game} from "../../../shared/model/notifications/Game";
import { UserIdentityService } from "../../../shared/services/user-identity.service";

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
  private readonly notificationService = inject(NotificationService);
  private readonly identityService = inject(UserIdentityService);
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
    console.log('ngOnInit called');
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
    console.log('loadGames called');
    this.errorMessage.set(null);
    this.isLoadingUpcoming.set(true);
    this.isLoadingActive.set(true);

    const liveParams = { page: this.defaultPage, size: this.defaultResultsPerPage };
    const upcomingParams = { page: this.defaultPage, size: this.defaultResultsPerPage };
    console.log('Params prepared:', liveParams, upcomingParams);

    const live$ = this.notificationService.getLiveGames(liveParams).pipe(
        map((page: Page<Game>) => this.mapGamesToNotificationGames(page.content || [], EventStatus.LIVE))
    );

    const upcoming$ = this.notificationService.getUpcomingGames(upcomingParams).pipe(
        map((page: Page<Game>) => this.mapGamesToNotificationGames(page.content || [], EventStatus.UPCOMING))
    );

    console.log('Observables created');

    forkJoin({
      live: live$,
      upcoming: upcoming$
    }).pipe(
        takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (results) => {
        console.log('forkJoin next:', results);
        this.activeGames.set(results.live);
        this.upcomingGames.set(results.upcoming);
        this.isLoadingUpcoming.set(false);
        this.isLoadingActive.set(false);
      },
      error: (error) => {
        console.error('forkJoin error:', error);
        this.errorMessage.set('Failed to load games. Please try again.');
        this.isLoadingUpcoming.set(false);
        this.isLoadingActive.set(false);
      },
      complete: () => {
        console.log('forkJoin complete');
      }
    });
    console.log('Subscribed to forkJoin');
  }

  /**
   * Map backend games to NotificationGame array
   */
  private mapGamesToNotificationGames(games: Game[], defaultStatus: EventStatus): NotificationGame[] {
    console.log('Mapping games:', games.length, 'with status:', defaultStatus);
    return games.map(game => this.mapGameToNotificationGame(game, defaultStatus));
  }

  /**
   * Map backend Game model to NotificationGame
   */
  private mapGameToNotificationGame(game: Game, defaultStatus: EventStatus): NotificationGame {
    return {
      id: game.id.toString(),
      sportType: game.league || 'N/A',
      homeTeam: game.homeTeam || 'HOME',
      awayTeam: game.awayTeam || 'AWAY',
      homeScore: game.homeScore?.toString() || '0',
      awayScore: game.awayScore?.toString() || '0',
      scheduledTime: this.formatGameTime(game.scheduledTime),
      homeRecord: '', // TODO: Fetch if available from backend
      awayRecord: '', // TODO: Fetch if available from backend
      status: this.mapGameStatus(game.status || '') || defaultStatus
    };
  }

  /**
   * Map backend game status to EventStatus
   */
  private mapGameStatus(statusStr: string): EventStatus | undefined {
    const key = statusStr.toUpperCase() as keyof typeof EventStatus;
    return EventStatus[key];
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
    console.log('initializeFromRoute called');
    this.route.queryParams
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(params => {
          console.log('Query params:', params);
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
    console.log('preselectGame called with id:', gameId);
    // Wait for games to load before preselecting
    const checkGames = () => {
      const allGames = [...this.upcomingGames(), ...this.activeGames()];
      const game = allGames.find(g => g.id === gameId);

      if (game) {
        console.log('Game preselected:', game);
        this.selectedGames = [game];
        this.currentStep = 2;
        this.activeTab = game.status === EventStatus.LIVE ? 'live' : 'upcoming';
      } else if (this.isLoading()) {
        // Games are still loading, check again after a short delay
        setTimeout(checkGames, 100);
      } else {
        console.log('Game not found after loading');
      }
    };

    checkGames();
  }

  private loadExistingNotification(notificationId: number): void {
    console.log('loadExistingNotification called with id:', notificationId);
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
  async createNotifications(): Promise<void> {
    if (this.mode === 'edit') {
      await this.updateNotification();
    } else {
      await this.createNewNotifications();
    }
  }

  private async createNewNotifications(): Promise<void> {
    console.log('Creating notifications:', {
      games: this.selectedGames,
      type: this.selectedNotificationType,
      commonSettings: this.notificationSettings,
      typeSpecificSettings: this.typeSpecificPreferences
    });

    try {
      // Get current user ID
      const userId = await this.identityService.getCurrentUserId();
      if (!userId) {
        console.error('User not authenticated');
        this.errorMessage.set('User not authenticated');
        return;
      }

      console.log(`Creating ${this.selectedGames.length} notification(s) for user: ${userId}`);

      // Create subscriptions for each selected game
      const createPromises = this.selectedGames.map(game =>
          this.createSubscriptionForGame(game, userId)
      );

      const results = await Promise.all(createPromises);

      console.log('All notifications created successfully:', results);

      const message = `${this.selectedGames.length} notification${this.selectedGames.length !== 1 ? 's' : ''} created successfully!`;

      // Add a small delay to ensure backend has processed
      await new Promise(resolve => setTimeout(resolve, 300));

      this.navigateBackWithMessage(message);
    } catch (error) {
      console.error('Failed to create notifications:', error);
      this.errorMessage.set('Failed to create notifications. Please try again.');
    }
  }

  private async createSubscriptionForGame(game: NotificationGame, userId: string): Promise<any> {
    console.log(`Creating subscription for game: ${game.awayTeam} @ ${game.homeTeam}`);

    const subscription = {
      userId: userId,
      gameId: game.id,
      eventType: this.selectedNotificationType,
      league: game.sportType,
      sportType: game.sportType,
      isEnabled: this.notificationSettings.enableImmediately,
      game: {
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        scheduledTime: game.scheduledTime,
        league: game.sportType,
        homeScore: parseInt(game.homeScore) || 0,
        awayScore: parseInt(game.awayScore) || 0,
        status: game.status
      },
      preferences: {
        ...this.typeSpecificPreferences,
        gameHoursOnly: this.notificationSettings.gameHoursOnly,
        autoDisable: this.notificationSettings.autoDisable
      },
      lastTriggered: 'Never',
      triggerCount: 0
    };

    console.log('Subscription payload:', subscription);

    const result = await this.notificationService.createSubscription(subscription as any);

    console.log('Subscription created:', result);

    return result;
  }

  private async updateNotification(): Promise<void> {
    console.log('Updating notification:', {
      id: this.editingNotificationId,
      games: this.selectedGames,
      type: this.selectedNotificationType,
      commonSettings: this.notificationSettings,
      typeSpecificSettings: this.typeSpecificPreferences
    });

    try {
      if (!this.editingNotificationId) {
        this.errorMessage.set('No notification ID provided');
        return;
      }

      const userId = await this.identityService.getCurrentUserId();
      if (!userId) {
        this.errorMessage.set('User not authenticated');
        return;
      }

      const game = this.selectedGames[0];
      if (!game) {
        this.errorMessage.set('No game selected');
        return;
      }

      const subscription = {
        id: this.editingNotificationId.toString(),
        userId: userId,
        gameId: game.id,
        eventType: this.selectedNotificationType,
        league: game.sportType,
        sportType: game.sportType,
        isEnabled: this.notificationSettings.enableImmediately,
        game: {
          id: game.id,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          scheduledTime: game.scheduledTime,
          league: game.sportType,
          homeScore: parseInt(game.homeScore) || 0,
          awayScore: parseInt(game.awayScore) || 0,
          status: game.status
        },
        preferences: {
          ...this.typeSpecificPreferences,
          gameHoursOnly: this.notificationSettings.gameHoursOnly,
          autoDisable: this.notificationSettings.autoDisable
        },
        lastTriggered: 'Never',
        triggerCount: 0
      };

      await this.notificationService.updateSubscription(this.editingNotificationId.toString(), subscription as any);

      const message = 'Notification updated successfully!';
      this.navigateBackWithMessage(message);
    } catch (error) {
      console.error('Failed to update notification:', error);
      this.errorMessage.set('Failed to update notification. Please try again.');
    }
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

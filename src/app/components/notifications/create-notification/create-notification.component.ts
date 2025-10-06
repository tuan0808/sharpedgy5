import {Component, Inject, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
export class BreakpointState {
  isMobile: boolean = false;
  isTablet: boolean = false;
  isDesktop: boolean = true;
  screenWidth: number = 1920;
  orientation: 'portrait' | 'landscape' = 'landscape';
}

export class NotificationGame {
  id: string;
  sportType : string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  scheduledTime: string;
  homeRecord: string;
  awayRecord: string;
  status: string;
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

  // Data
  upcomingGames: NotificationGame[] = [
    { id: 'bal-cle', sportType: 'MLB', homeTeam: 'CLE', awayTeam: 'BAL', homeScore: '', awayScore: '', scheduledTime: '6:40 PM ET', homeRecord: '40-50', awayRecord: '44-55', status: EventStatus.UPCOMING },
    { id: 'det-pit', sportType: 'MLB', homeTeam: 'PIT', awayTeam: 'DET', homeScore: '', awayScore: '', scheduledTime: '6:40 PM ET', homeRecord: '40-61', awayRecord: '50-41', status: EventStatus.UPCOMING },
    { id: 'sd-mia', sportType: 'MLB', homeTeam: 'MIA', awayTeam: 'SD', homeScore: '', awayScore: '', scheduledTime: '6:40 PM ET', homeRecord: '45-53', awayRecord: '55-45', status: EventStatus.UPCOMING },
    { id: 'bos-phi', sportType: 'MLB', homeTeam: 'PHI', awayTeam: 'BOS', homeScore: '', awayScore: '', scheduledTime: '6:45 PM ET', homeRecord: '57-43', awayRecord: '54-48', status: EventStatus.UPCOMING },
    { id: 'cin-wsh', sportType: 'MLB', homeTeam: 'WSH', awayTeam: 'CIN', homeScore: '', awayScore: '', scheduledTime: '6:46 PM ET', homeRecord: '40-60', awayRecord: '52-49', status: EventStatus.UPCOMING },
    { id: 'chw-tb', sportType: 'MLB', homeTeam: 'TB', awayTeam: 'CHW', homeScore: '', awayScore: '', scheduledTime: '7:05 PM ET', homeRecord: '52-49', awayRecord: '35-65', status: EventStatus.UPCOMING }
  ];

  activeGames: NotificationGame[] = [
    { id: 'lal-gsw-live', sportType: 'NBA', homeTeam: 'GSW', awayTeam: 'LAL', homeScore: '89', awayScore: '92', scheduledTime: 'Q3 8:24', homeRecord: '35-47', awayRecord: '42-40', status: EventStatus.LIVE },
    { id: 'bos-mia-live', sportType: 'NBA', homeTeam: 'MIA', awayTeam: 'BOS', homeScore: '76', awayScore: '81', scheduledTime: 'Q3 5:12', homeRecord: '44-38', awayRecord: '57-25', status: EventStatus.LIVE }
  ];

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
    'ScheduledGame Start/End'
  ];

  darkMode = false;

  constructor(
      private router: Router,
      private route: ActivatedRoute,
      @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize typeSpecificPreferences based on default notification type
    this.typeSpecificPreferences = this.getDefaultPreferences('Point Spread Diff');
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectDevice();
    }
    this.initializeFromRoute();
  }

  private initializeFromRoute(): void {
    this.route.queryParams.subscribe(params => {
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
    const game = [...this.upcomingGames, ...this.activeGames].find(g => g.id === gameId);
    if (game) {
      this.selectedGames = [game];
      this.currentStep = 2;
      this.activeTab = game.status === EventStatus.LIVE ? 'live' : 'upcoming';
    }
  }

  private loadExistingNotification(notificationId: number): void {
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
      const game = [...this.upcomingGames, ...this.activeGames].find(g => g.id === notification.gameId);
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
      case 'ScheduledGame Start/End':
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
    return 'Create ScheduledGame Notifications';
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

  // ScheduledGame selection methods
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
}

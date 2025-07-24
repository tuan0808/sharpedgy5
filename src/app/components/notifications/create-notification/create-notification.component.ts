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
@Component({
  selector: 'app-create-notification',
  standalone: true,
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
  upcomingGames = [
    { id: 'bal-cle', home: 'CLE', away: 'BAL', homeScore: '', awayScore: '', time: '6:40 PM ET', homeRecord: '40-50', awayRecord: '44-55', status: 'upcoming', league: 'MLB' },
    { id: 'det-pit', home: 'PIT', away: 'DET', homeScore: '', awayScore: '', time: '6:40 PM ET', homeRecord: '40-61', awayRecord: '50-41', status: 'upcoming', league: 'MLB' },
    { id: 'sd-mia', home: 'MIA', away: 'SD', homeScore: '', awayScore: '', time: '6:40 PM ET', homeRecord: '45-53', awayRecord: '55-45', status: 'upcoming', league: 'MLB' },
    { id: 'bos-phi', home: 'PHI', away: 'BOS', homeScore: '', awayScore: '', time: '6:45 PM ET', homeRecord: '57-43', awayRecord: '54-48', status: 'upcoming', league: 'MLB' },
    { id: 'cin-wsh', home: 'WSH', away: 'CIN', homeScore: '', awayScore: '', time: '6:46 PM ET', homeRecord: '40-60', awayRecord: '52-49', status: 'upcoming', league: 'MLB' },
    { id: 'chw-tb', home: 'TB', away: 'CHW', homeScore: '', awayScore: '', time: '7:05 PM ET', homeRecord: '52-49', awayRecord: '35-65', status: 'upcoming', league: 'MLB' }
  ];

  activeGames = [
    { id: 'lal-gsw-live', home: 'GSW', away: 'LAL', homeScore: '89', awayScore: '92', time: 'Q3 8:24', homeRecord: '35-47', awayRecord: '42-40', status: 'live', league: 'NBA' },
    { id: 'bos-mia-live', home: 'MIA', away: 'BOS', homeScore: '76', awayScore: '81', time: 'Q3 5:12', homeRecord: '44-38', awayRecord: '57-25', status: 'live', league: 'NBA' }
  ];

  // Form mode and state
  mode: 'create' | 'edit' = 'create';
  editingNotificationId?: number;
  preselectedGameId?: string;
  activeTab = 'upcoming';
  selectedGames: any[] = [];
  selectedNotificationType = 'Point Spread Diff';
  notificationSettings = {
    sensitivity: 'medium',
    gameHoursOnly: false,
    enableImmediately: true,
    autoDisable: false
  };

  notificationTypes = [
    'Point Spread Diff',
    'Betting Volume Spike',
    'Score Update',
    'Moneyline Odds',
    'Over/Under',
    'Game Start/End'
  ];

  darkMode = false;

  constructor(
      private router: Router,
      private route: ActivatedRoute,
      @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectDevice();
    }
    this.initializeFromRoute();
  }

  private initializeFromRoute(): void {
    this.route.queryParams.subscribe(params => {
      // Check if editing existing notification
      if (params['edit'] && params['id']) {
        this.mode = 'edit';
        this.editingNotificationId = parseInt(params['id']);
        this.loadExistingNotification(this.editingNotificationId);
      }
      // Check if creating from specific game
      else if (params['gameId']) {
        this.mode = 'create';
        this.preselectedGameId = params['gameId'];
        this.preselectGame(params['gameId']);
      }
      // Default create mode
      else {
        this.mode = 'create';
        this.currentStep = 1;
      }
    });
  }

  private preselectGame(gameId: string): void {
    // Find the game in upcoming or active games
    const game = [...this.upcomingGames, ...this.activeGames].find(g => g.id === gameId);
    if (game) {
      this.selectedGames = [game];
      // Skip game selection step and go directly to settings
      this.currentStep = 2;
      // Set the active tab based on game status
      this.activeTab = game.status === 'live' ? 'live' : 'upcoming';
    }
  }

  private loadExistingNotification(notificationId: number): void {
    // In a real app, you'd load this from a service
    // For now, we'll simulate loading from the notifications list
    const existingNotifications = [
      {
        id: 1,
        type: 'Point Spread Diff',
        gameId: 'lal-gsw-20241125',
        homeTeam: 'Lakers',
        awayTeam: 'Warriors',
        gameDate: '2024-11-25',
        gameTime: '7:30 PM PST',
        sport: 'Basketball',
        league: 'NBA',
        enabled: true,
        conditions: { threshold: 1.5, direction: 'any' },
        lastTriggered: '2 min ago',
        triggerCount: 3,
        season: '2024-25 Regular Season',
        priority: 5,
        savings: 15,
        settings: {
          sensitivity: 'medium',
          gameHoursOnly: true,
          enableImmediately: true,
          autoDisable: false
        }
      }
      // Add other mock notifications as needed
    ];

    const notification = existingNotifications.find(n => n.id === notificationId);
    if (notification) {
      // Find and set the game
      const game = [...this.upcomingGames, ...this.activeGames].find(g =>
          g.id === notification.gameId ||
          (g.home === notification.homeTeam && g.away === notification.awayTeam)
      );

      if (game) {
        this.selectedGames = [game];
        this.activeTab = game.status === 'live' ? 'live' : 'upcoming';
      }

      // Set the notification type and settings
      this.selectedNotificationType = notification.type;
      if (notification.settings) {
        this.notificationSettings = { ...notification.settings };
      }

      // Go directly to settings step
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
      return game ? `Create Notification for ${game.away} @ ${game.home}` : 'Create Notification';
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
    return this.currentStep === 2 || this.preselectedGameId != null|| this.mode === 'edit';
  }

  // Game selection methods
  isGameSelected(gameId: string): boolean {
    return this.selectedGames.some(game => game.id === gameId);
  }

  toggleGameSelection(game: any): void {
    if (this.isGameSelected(game.id)) {
      this.selectedGames = this.selectedGames.filter(g => g.id !== game.id);
    } else {
      this.selectedGames = [...this.selectedGames, game];
    }
  }

  removeSelectedGame(game: any): void {
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
      settings: this.notificationSettings
    });

    const message = `${this.selectedGames.length} notification${this.selectedGames.length !== 1 ? 's' : ''} created successfully!`;
    this.navigateBackWithMessage(message);
  }

  private updateNotification(): void {
    console.log('Updating notification:', {
      id: this.editingNotificationId,
      games: this.selectedGames,
      type: this.selectedNotificationType,
      settings: this.notificationSettings
    });

    const message = 'Notification updated successfully!';
    this.navigateBackWithMessage(message);
  }

  private navigateBackWithMessage(message: string): void {
    this.router.navigate(['/notifications/home'], {
      queryParams: {
        message: message
      }
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

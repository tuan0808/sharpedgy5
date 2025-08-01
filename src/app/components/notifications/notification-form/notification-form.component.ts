import {Component, EventEmitter, HostListener, Inject, Input, Output, PLATFORM_ID} from '@angular/core';
import {NotificationFormData} from "../../../shared/model/notifications/NotificationFormData";
import {NotificationSettings} from "../../../shared/model/notifications/NotificationSettings";
import {Game} from "../../../shared/model/notifications/Game";
import {isPlatformBrowser} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  orientation: 'portrait' | 'landscape';
}


export interface NotificationType {
  id: string;
  name: string;
  description: string;
  icon: string;
  premium: boolean;
}

export interface NotificationForm {
  games: string[];
  notificationType: string;
  conditions: {
    threshold?: number;
    direction?: string;
    volumeThreshold?: number;
    marketType?: string;
    frequency?: string;
  };
  delivery: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
  priority: string;
  enabled: boolean;
}

@Component({
  selector: 'app-notification-form',
  standalone: true,
  imports: [],
  templateUrl: './notification-form.component.html',
  styleUrl: './notification-form.component.scss'
})
export class NotificationFormComponent {
  breakpoint: BreakpointState = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    orientation: 'landscape'
  };

  // Form state
  currentStep = 1;
  isEditMode = false;
  editingNotificationId: number | null = null;
  darkMode = false;

  // UI state
  activeGameTab = 'upcoming';
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  // Selected data
  selectedGames: Game[] = [];

  // Form data
  formData: NotificationForm = {
    games: [],
    notificationType: '',
    conditions: {},
    delivery: {
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false
    },
    priority: 'normal',
    enabled: true
  };

  // Static data
  upcomingGames: Game[] = [
    {
      id: 'bal-cle-upcoming',
      home: 'CLE',
      away: 'BAL',
      time: '6:40 PM ET',
      date: '2024-11-25',
      homeRecord: '40-50',
      awayRecord: '44-55',
      status: 'upcoming',
      league: 'MLB'
    },
    {
      id: 'det-pit-upcoming',
      home: 'PIT',
      away: 'DET',
      time: '6:40 PM ET',
      date: '2024-11-25',
      homeRecord: '40-61',
      awayRecord: '50-41',
      status: 'upcoming',
      league: 'MLB'
    },
    {
      id: 'sd-mia-upcoming',
      home: 'MIA',
      away: 'SD',
      time: '6:40 PM ET',
      date: '2024-11-25',
      homeRecord: '45-53',
      awayRecord: '55-45',
      status: 'upcoming',
      league: 'MLB'
    },
    {
      id: 'bos-phi-upcoming',
      home: 'PHI',
      away: 'BOS',
      time: '6:45 PM ET',
      date: '2024-11-25',
      homeRecord: '57-43',
      awayRecord: '54-48',
      status: 'upcoming',
      league: 'MLB'
    },
    {
      id: 'kc-buf-upcoming',
      home: 'BUF',
      away: 'KC',
      time: '4:25 PM EST',
      date: '2024-11-27',
      homeRecord: '8-3',
      awayRecord: '9-2',
      status: 'upcoming',
      league: 'NFL'
    },
    {
      id: 'lal-gsw-upcoming',
      home: 'GSW',
      away: 'LAL',
      time: '7:30 PM PST',
      date: '2024-11-25',
      homeRecord: '35-47',
      awayRecord: '42-40',
      status: 'upcoming',
      league: 'NBA'
    }
  ];

  liveGames: Game[] = [
    {
      id: 'lal-gsw-live',
      home: 'GSW',
      away: 'LAL',
      homeScore: '89',
      awayScore: '92',
      time: 'Q3 8:24',
      date: '2024-11-25',
      homeRecord: '35-47',
      awayRecord: '42-40',
      status: 'live',
      league: 'NBA'
    },
    {
      id: 'bos-mia-live',
      home: 'MIA',
      away: 'BOS',
      homeScore: '76',
      awayScore: '81',
      time: 'Q3 5:12',
      date: '2024-11-25',
      homeRecord: '44-38',
      awayRecord: '57-25',
      status: 'live',
      league: 'NBA'
    }
  ];

  notificationTypes: NotificationType[] = [
    {
      id: 'point-spread',
      name: 'Point Spread Changes',
      description: 'Get notified when point spreads move significantly',
      icon: 'bi-graph-up-arrow',
      premium: false
    },
    {
      id: 'betting-volume',
      name: 'Betting Volume Spike',
      description: 'Alert when unusual betting activity is detected',
      icon: 'bi-lightning-charge',
      premium: true
    },
    {
      id: 'score-update',
      name: 'Score Updates',
      description: 'Real-time score changes and game progress',
      icon: 'bi-trophy',
      premium: false
    },
    {
      id: 'moneyline-odds',
      name: 'Moneyline Odds',
      description: 'Track significant moneyline movement',
      icon: 'bi-currency-dollar',
      premium: false
    },
    {
      id: 'over-under',
      name: 'Over/Under Changes',
      description: 'Monitor total points line movements',
      icon: 'bi-bar-chart-line',
      premium: true
    },
    {
      id: 'game-events',
      name: 'Game Start/End',
      description: 'Notifications for game beginning and final scores',
      icon: 'bi-clock',
      premium: false
    }
  ];

  constructor(
      @Inject(PLATFORM_ID) private platformId: Object,
      private router: Router,
      private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectDevice();
      this.checkQueryParams();
      this.loadDarkModePreference();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  // Initialization methods
  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['edit'] && params['id']) {
        this.isEditMode = true;
        this.editingNotificationId = parseInt(params['id']);
        this.loadNotificationForEdit();
      }

      if (params['gameId']) {
        this.preselectGame(params['gameId']);
      }
    });
  }

  private loadNotificationForEdit(): void {
    // In a real app, this would load from a service
    // For now, we'll simulate loading an existing notification
    this.formData = {
      games: ['lal-gsw-upcoming'],
      notificationType: 'point-spread',
      conditions: {
        threshold: 1.5,
        direction: 'any'
      },
      delivery: {
        pushEnabled: true,
        emailEnabled: false,
        smsEnabled: false
      },
      priority: 'high',
      enabled: true
    };

    // Pre-select the games
    this.selectedGames = this.upcomingGames.filter(game =>
        this.formData.games.includes(game.id)
    );

    // Move to the appropriate step based on what's already filled
    if (this.formData.games.length > 0) {
      this.currentStep = 2;
    }
    if (this.formData.notificationType) {
      this.currentStep = 3;
    }
  }

  private preselectGame(gameId: string): void {
    const game = [...this.upcomingGames, ...this.liveGames].find(g => g.id === gameId);
    if (game && !this.isGameSelected(gameId)) {
      this.selectedGames.push(game);
      this.formData.games.push(gameId);
    }
  }

  private loadDarkModePreference(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('darkMode');
      this.darkMode = saved ? JSON.parse(saved) : false;
    }
  }

  // Device detection
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

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectDevice();
    }
  }

  // Navigation methods
  navigateBack(): void {
    this.router.navigate(['/notifications']);
  }

  // Step navigation
  nextStep(): void {
    if (this.canProceedToNextStep()) {
      this.currentStep++;
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.selectedGames.length > 0;
      case 2:
        return this.formData.notificationType !== '';
      case 3:
        return this.isFormValid();
      default:
        return false;
    }
  }

  getProgressPercentage(): number {
    return (this.currentStep / 3) * 100;
  }

  // Game selection methods
  isGameSelected(gameId: string): boolean {
    return this.selectedGames.some(game => game.id === gameId);
  }

  toggleGameSelection(game: Game): void {
    if (this.isGameSelected(game.id)) {
      this.removeGameSelection(game);
    } else {
      this.selectedGames.push(game);
      this.formData.games.push(game.id);
    }

    // Haptic feedback for mobile
    if (isPlatformBrowser(this.platformId) && 'vibrate' in navigator && this.breakpoint.isMobile) {
      navigator.vibrate(50);
    }
  }

  removeGameSelection(game: Game): void {
    this.selectedGames = this.selectedGames.filter(g => g.id !== game.id);
    this.formData.games = this.formData.games.filter(id => id !== game.id);
  }

  // Notification type methods
  onNotificationTypeChange(type: NotificationType): void {
    this.formData.notificationType = type.id;

    // Reset conditions when type changes
    this.formData.conditions = {};

    // Set default conditions based on type
    switch (type.id) {
      case 'point-spread':
        this.formData.conditions = {
          threshold: 1.5,
          direction: 'any'
        };
        break;
      case 'betting-volume':
        this.formData.conditions = {
          volumeThreshold: 200,
          marketType: 'all'
        };
        break;
      case 'score-update':
        this.formData.conditions = {
          frequency: 'every-score'
        };
        break;
      default:
        break;
    }
  }

  // Form validation
  isFormValid(): boolean {
    if (this.selectedGames.length === 0) return false;
    if (!this.formData.notificationType) return false;

    // Validate conditions based on notification type
    switch (this.formData.notificationType) {
      case 'point-spread':
        return !!(this.formData.conditions.threshold && this.formData.conditions.direction);
      case 'betting-volume':
        return !!(this.formData.conditions.volumeThreshold && this.formData.conditions.marketType);
      case 'score-update':
        return !!this.formData.conditions.frequency;
      default:
        return true;
    }
  }

  // Form submission
  submitForm(): void {
    if (!this.isFormValid()) {
      this.showToast('Please complete all required fields', 'error');
      return;
    }

    // Simulate API call
    const notification = {
      id: this.isEditMode ? this.editingNotificationId : Date.now(),
      ...this.formData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Submitting notification:', notification);

    // Show success message and navigate back
    const message = this.isEditMode ? 'Notification updated successfully!' : 'Notification created successfully!';

    this.router.navigate(['/notifications'], {
      queryParams: { message }
    });
  }

  // Utility methods
  getSelectedGamesText(): string {
    if (this.selectedGames.length === 0) return 'No games selected';
    if (this.selectedGames.length === 1) {
      const game = this.selectedGames[0];
      return `${game.away} @ ${game.home}`;
    }
    return `${this.selectedGames.length} games selected`;
  }

  getSelectedNotificationTypeText(): string {
    const type = this.notificationTypes.find(t => t.id === this.formData.notificationType);
    return type ? type.name : 'No type selected';
  }

  getConditionsText(): string {
    if (!this.formData.notificationType) return 'No conditions set';

    switch (this.formData.notificationType) {
      case 'point-spread':
        return `Alert when spread moves ${this.formData.conditions.threshold || 0} points ${this.formData.conditions.direction || 'any direction'}`;
      case 'betting-volume':
        return `Alert when ${this.formData.conditions.marketType || 'any'} market volume increases ${this.formData.conditions.volumeThreshold || 0}%`;
      case 'score-update':
        return `Send updates ${this.formData.conditions.frequency || 'every score change'}`;
      default:
        return 'Standard conditions';
    }
  }

  // Safe area utilities for iOS
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

  // Toast notification
  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => this.toastMessage = '', 3000);
  }

  // Dark mode toggle
  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    }
  }
}

import {Component, HostListener, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {DatePipe, isPlatformBrowser, NgForOf, NgIf, NgSwitch} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ActivatedRoute, Router} from "@angular/router";

export class BreakpointState  {
    isMobile: boolean    // True for phones
      isTablet: boolean    // True for tablets
      isDesktop: boolean   // True for desktop
      screenWidth: number   // Current screen width
      orientation: 'portrait' | 'landscape'
}

@Component({
  selector: 'app-notification-home',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
  ],
  templateUrl: './notification-home.component.html',
  styleUrl: './notification-home.component.scss'
})
export class NotificationHomeComponent implements OnInit {
  breakpoint: BreakpointState = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    orientation: 'landscape'
  };

  // Mobile UI state
  mobileSearchExpanded = false;
  mobileFiltersOpen = false;

  // Your existing data properties
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

  notifications = [
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
      savings: 15
    },
    {
      id: 2,
      type: 'Betting Volume Spike',
      gameId: 'kc-buf-20241127',
      homeTeam: 'Bills',
      awayTeam: 'Chiefs',
      gameDate: '2024-11-27',
      gameTime: '4:25 PM EST',
      sport: 'Football',
      league: 'NFL',
      enabled: true,
      conditions: { threshold: 250, market: 'over/under' },
      lastTriggered: '5 min ago',
      triggerCount: 1,
      season: '2024 Regular Season',
      priority: 4,
      savings: 25
    },
    {
      id: 3,
      type: 'Score Update',
      gameId: 'bos-mia-20241125',
      homeTeam: 'Heat',
      awayTeam: 'Celtics',
      gameDate: '2024-11-25',
      gameTime: '8:00 PM EST',
      sport: 'Basketball',
      league: 'NBA',
      enabled: false,
      conditions: { quarter: 'Q4', timeRemaining: '5:00' },
      lastTriggered: '1 hour ago',
      triggerCount: 0,
      season: '2024-25 Regular Season',
      priority: 3,
      savings: 30
    },
    {
      id: 4,
      type: 'Moneyline Odds',
      gameId: 'dal-nyg-20241128',
      homeTeam: 'Giants',
      awayTeam: 'Cowboys',
      gameDate: '2024-11-28',
      gameTime: '4:30 PM EST',
      sport: 'Football',
      league: 'NFL',
      enabled: true,
      conditions: { threshold: 25, direction: 'favoring_underdog' },
      lastTriggered: 'Never',
      triggerCount: 0,
      season: '2024 Regular Season',
      priority: 4,
      savings: 10
    }
  ];

  searchTerm = '';
  filters = {
    enabled: 'all',
    sport: 'all',
    type: 'all',
    league: 'all'
  };
  selectedNotifications: number[] = [];
  toastMessage = '';
  toastType = 'success';
  darkMode = false;
  activeTab = 'upcoming';
  selectionMode = false;

  sports = ['Basketball', 'Football', 'Baseball', 'Hockey'];
  leagues = ['NBA', 'NFL', 'MLB', 'NHL'];
  notificationTypes = [
    'Point Spread Diff',
    'Betting Volume Spike',
    'Score Update',
    'Moneyline Odds',
    'Over/Under',
    'Game Start/End',
    'Player Milestones',
    'Custom Conditions'
  ];

  constructor(
      @Inject(PLATFORM_ID) private platformId: Object,
      private router: Router,
      private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectDevice();
      this.setupTouchGestures();
      this.checkForSuccessMessage();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  // Check for success message from create notification page
  private checkForSuccessMessage(): void {
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.showToast(params['message'], 'success');
        // Clean up the URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
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

  // Viewport change listener
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectDevice();
      if (this.breakpoint.isMobile) {
        this.mobileSearchExpanded = false;
        this.mobileFiltersOpen = false;
      }
    }
  }

  // Touch gesture support
  private setupTouchGestures(): void {
    if (!this.breakpoint.isMobile || !isPlatformBrowser(this.platformId)) return;

    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;

      const deltaY = touchStartY - touchEndY;
      const deltaX = touchStartX - touchEndX;

      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && touchStartX < 50) {
          this.mobileFiltersOpen = true;
        } else if (deltaX < 0 && this.mobileFiltersOpen) {
          this.mobileFiltersOpen = false;
        }
      }
    }, { passive: true });
  }

  // Mobile UI methods
  toggleMobileSearch(): void {
    this.mobileSearchExpanded = !this.mobileSearchExpanded;

    if (this.mobileSearchExpanded) {
      setTimeout(() => {
        const searchInput = document.querySelector('.mobile-search-input') as HTMLInputElement;
        searchInput?.focus();
      }, 300);
    }
  }

  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;

    if (isPlatformBrowser(this.platformId)) {
      if (this.mobileFiltersOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  closeMobileOverlays(): void {
    this.mobileSearchExpanded = false;
    this.mobileFiltersOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  // Navigation to create notification page
  navigateToCreateNotification(): void {
    this.router.navigate(['/notifications/create']);
  }

  // Navigate to create notification for specific game
  navigateToCreateNotificationForGame(game: any): void {
    this.router.navigate(['/notifications/create'], {
      queryParams: { gameId: game.id }
    });
  }

  // Navigate to edit existing notification
  navigateToEditNotification(notificationId: number): void {
    this.router.navigate(['/notifications/create'], {
      queryParams: { edit: true, id: notificationId }
    });
  }

  // Mobile-optimized game selection
  handleMobileGameSelection(game: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (isPlatformBrowser(this.platformId) && 'vibrate' in navigator && this.breakpoint.isMobile) {
      navigator.vibrate(50);
    }

    // Navigate to create notification for this game
    this.navigateToCreateNotificationForGame(game);
  }

  // Mobile-optimized notification toggle
  toggleNotificationMobile(id: number, event?: Event): void {
    event?.stopPropagation();

    if (isPlatformBrowser(this.platformId) && 'vibrate' in navigator && this.breakpoint.isMobile) {
      navigator.vibrate(100);
    }

    this.toggleNotification(id);
  }

  // Responsive grid calculation
  getGridColumns(): string {
    if (this.breakpoint.isMobile) {
      return this.breakpoint.orientation === 'portrait' ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)';
    } else if (this.breakpoint.isTablet) {
      return 'repeat(2, 1fr)';
    } else {
      return 'repeat(auto-fill, minmax(300px, 1fr))';
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

  // Your existing methods
  showToast(message: string, type = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => this.toastMessage = '', 3000);
  }

  toggleNotification(id: number) {
    this.notifications = this.notifications.map(notif =>
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
    );
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      this.showToast(
          `Notification ${notification.enabled ? 'enabled' : 'disabled'} for ${notification.awayTeam} vs ${notification.homeTeam}`,
          'success'
      );
    }
  }

  get filteredNotifications() {
    return this.notifications.filter(notification => {
      const matchesSearch = notification.homeTeam.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          notification.awayTeam.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          notification.type.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesEnabled = this.filters.enabled === 'all' ||
          (this.filters.enabled === 'enabled' && notification.enabled) ||
          (this.filters.enabled === 'disabled' && !notification.enabled);
      const matchesSport = this.filters.sport === 'all' || notification.sport === this.filters.sport;
      const matchesType = this.filters.type === 'all' || notification.type === this.filters.type;
      const matchesLeague = this.filters.league === 'all' || notification.league === this.filters.league;
      return matchesSearch && matchesEnabled && matchesSport && matchesType && matchesLeague;
    });
  }

  isGameSelected(id: string) {
    return false; // Not needed anymore since we removed the modal
  }

  isNotificationSelected(id: number) {
    return this.selectedNotifications.includes(id);
  }

  addSelectedNotification(id: number) {
    this.selectedNotifications = [...this.selectedNotifications, id];
  }

  removeSelectedNotification(id: number) {
    this.selectedNotifications = this.selectedNotifications.filter(selectedId => selectedId !== id);
  }
}

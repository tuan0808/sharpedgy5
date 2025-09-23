import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  Inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  signal,
  DestroyRef,
  afterNextRender
} from '@angular/core';
import { AsyncPipe, DatePipe, isPlatformBrowser, NgForOf, NgIf, NgSwitch, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from "@angular/router";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from "../../../shared/services/notifications/notification.service";
import { UserIdentityService } from "../../../shared/services/user-identity.service";
import { NotificationFilters } from "../../../shared/model/notifications/NotificationFilters";
import { PaginationComponent } from "../../../shared/components/pagination/pagination.component";

export class BreakpointState {
  isMobile: boolean = false;
  isTablet: boolean = false;
  isDesktop: boolean = true;
  screenWidth: number = 1920;
  orientation: 'portrait' | 'landscape' = 'landscape';
}

@Component({
  selector: 'app-notification-home',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    PaginationComponent,
  ],
  templateUrl: './notification-home.component.html',
  styleUrl: './notification-home.component.scss'
})
export class NotificationHomeComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private identityService = inject(UserIdentityService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);

  // SSR-safe breakpoint management
  breakpoint = signal<BreakpointState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    orientation: 'landscape'
  });

  // Mobile UI state signals
  mobileSearchExpanded = signal(false);
  mobileFiltersOpen = signal(false);

  // Game data
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

  // Service data - server-side filtered and paginated
  readonly notifications = this.notificationService.subscriptions;
  readonly loading = this.notificationService.loading;
  readonly error = this.notificationService.error;
  readonly totalElements = this.notificationService.totalElements;
  readonly totalPages = this.notificationService.totalPages;
  readonly currentPage = this.notificationService.currentPage;
  readonly pageSize = this.notificationService.pageSize;

  // Search and filters - using signals with proper two-way binding support
  searchTerm = signal('');
  filters = signal<NotificationFilters>({
    enabled: 'all',
    sport: 'all',
    type: 'all',
    league: 'all'
  });

  // Computed properties for UI
  readonly filteredNotifications = this.notifications;
  readonly totalCount = this.totalElements;
  readonly enabledCount = computed(() => this.notifications().filter(sub => sub.isEnabled).length);
  readonly hasSubscriptions = computed(() => this.totalCount() > 0);
  readonly isLoading = this.loading;
  readonly hasFiltersApplied = computed(() => {
    const filters = this.filters();
    const hasSearch = this.searchTerm().trim().length > 0;
    return hasSearch ||
        filters.enabled !== 'all' ||
        filters.sport !== 'all' ||
        filters.type !== 'all' ||
        filters.league !== 'all';
  });

  // UI state signals
  selectedNotifications = signal<string[]>([]);
  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'info'>('success');
  activeTab = signal<'upcoming' | 'live'>('upcoming');
  selectionMode = signal(false);

  // SSR-safe timeout handling
  private searchTimeout: number | null = null;

  // Expose Math for template
  readonly Math = Math;

  // Static data
  sports = ['Basketball', 'Football', 'Baseball', 'Hockey'];
  leagues = ['NBA', 'NFL', 'MLB', 'NHL'];
  notificationTypes = [
    'Point Spread Diff', 'Betting Volume Spike', 'Score Update',
    'Moneyline Odds', 'Over/Under', 'Game Start/End',
    'Player Milestones', 'Custom Conditions'
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.initializeBrowserOnlyFeatures();
      });
    }

    // Setup effects for reactive updates
    effect(() => {
      // Auto-clear toast messages
      const message = this.toastMessage();
      if (message && isPlatformBrowser(this.platformId)) {
        setTimeout(() => this.toastMessage.set(''), 3000);
      }
    });

    effect(() => {
      // Handle mobile overlay body scroll
      const filtersOpen = this.mobileFiltersOpen();
      if (isPlatformBrowser(this.platformId)) {
        this.document.body.style.overflow = filtersOpen ? 'hidden' : '';
      }
    });

    // Watch for search term changes
    effect(() => {
      const searchTerm = this.searchTerm();
      this.debouncedLoad();
    });

    // Watch for filter changes
    effect(() => {
      const filters = this.filters();
      this.loadData();
    });
  }

  async ngOnInit(): Promise<void> {
    // SSR-safe initialization
    try {
      await this.identityService.waitForUser();
      await this.notificationService.initialize();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      this.showToast('Failed to load notifications', 'error');
    }

    // Subscribe to route params for success messages
    this.route.queryParams
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(params => {
          if (params['message']) {
            this.showToast(params['message'], 'success');
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              replaceUrl: true
            });
          }
        });
  }

  ngOnDestroy(): void {
    // Cleanup is handled by takeUntilDestroyed and DestroyRef
    if (this.searchTimeout && isPlatformBrowser(this.platformId)) {
      clearTimeout(this.searchTimeout);
    }

    if (isPlatformBrowser(this.platformId)) {
      this.document.body.style.overflow = '';
    }
  }

  private initializeBrowserOnlyFeatures(): void {
    this.detectDevice();
    this.setupTouchGestures();
  }

  // Data loading methods
  private async loadData(page: number = 0): Promise<void> {
    const userId = await this.identityService.getCurrentUserId();
    if (!userId) return;

    try {
      await this.notificationService.loadSubscriptions(
          userId,
          this.filters(),
          this.searchTerm(),
          page,
          20
      );
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showToast('Failed to load notifications', 'error');
    }
  }

  private debouncedLoad(): void {
    if (this.searchTimeout && isPlatformBrowser(this.platformId)) {
      clearTimeout(this.searchTimeout);
    }

    if (isPlatformBrowser(this.platformId)) {
      this.searchTimeout = window.setTimeout(() => this.loadData(), 500);
    } else {
      // Immediate load during SSR
      this.loadData();
    }
  }

  // Pagination methods - FIXED
  async changePage(page: number): Promise<void> {
    console.log('Changing to page:', page);
    await this.loadData(page - 1); // Convert 1-based pagination to 0-based for API
  }

  async onPageChange(page: number): Promise<void> {
    await this.changePage(page);
  }

  async onPageSizeChange(size: number): Promise<void> {
    const userId = await this.identityService.getCurrentUserId();
    if (userId) {
      await this.notificationService.loadSubscriptions(
          userId,
          this.filters(),
          this.searchTerm(),
          0,
          size
      );
    }
  }

  async nextPage(): Promise<void> {
    if (this.currentPage() < this.totalPages()) {
      await this.changePage(this.currentPage() + 1);
    }
  }

  async previousPage(): Promise<void> {
    if (this.currentPage() > 1) {
      await this.changePage(this.currentPage() - 1);
    }
  }

  // Filter methods
  updateFilters(newFilters: Partial<NotificationFilters>): void {
    this.filters.set({ ...this.filters(), ...newFilters });
  }

  async clearFilters(): Promise<void> {
    this.filters.set({ enabled: 'all', sport: 'all', type: 'all', league: 'all' });
    this.searchTerm.set('');
    await this.loadData();
  }

  async refreshNotifications(): Promise<void> {
    await this.notificationService.refresh();
  }

  // Notification operations
  async toggleNotification(id: string): Promise<void> {
    try {
      const result = await this.notificationService.toggleSubscription(id);
      this.showToast(
          `Notification ${result.isEnabled ? 'enabled' : 'disabled'}`,
          'success'
      );
      await this.loadData(this.currentPage() - 1);
    } catch (error) {
      console.error('Failed to toggle notification:', error);
      this.showToast('Failed to update notification', 'error');
    }
  }

  async deleteNotification(id: string): Promise<void> {
    const notification = this.notificationService.getSubscriptionById(id);
    if (!notification) {
      this.showToast('Notification not found', 'error');
      return;
    }

    const userId = await this.identityService.getCurrentUserId();
    if (!userId) {
      this.showToast('User not authenticated', 'error');
      return;
    }

    try {
      const deleted = await this.notificationService.deleteSubscription(userId, id);
      if (deleted) {
        this.showToast('Notification deleted successfully', 'success');
        await this.loadData(this.currentPage() - 1);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      this.showToast('Failed to delete notification', 'error');
    }
  }

  // SSR-safe device detection
  private detectDevice(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // Set default values for SSR
      this.breakpoint.set({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1920,
        orientation: 'landscape'
      });
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    const isSmallScreen = screenWidth <= 768;

    this.breakpoint.set({
      isMobile: isMobileDevice || (isTouchDevice && isSmallScreen),
      isTablet: screenWidth > 768 && screenWidth <= 1024 && isTouchDevice,
      isDesktop: screenWidth > 1024 && !isTouchDevice,
      screenWidth,
      orientation: screenWidth > screenHeight ? 'landscape' : 'portrait'
    });

    if (this.breakpoint().isMobile) {
      this.document.body.classList.add('mobile-device');
      if (/ipad|iphone|ipod/.test(userAgent)) {
        this.document.body.classList.add('ios-device');
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectDevice();
      if (this.breakpoint().isMobile) {
        this.mobileSearchExpanded.set(false);
        this.mobileFiltersOpen.set(false);
      }
    }
  }

  private setupTouchGestures(): void {
    if (!this.breakpoint().isMobile || !isPlatformBrowser(this.platformId)) return;

    let touchStartX = 0;
    let touchStartY = 0;

    this.document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    this.document.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;

      const deltaY = touchStartY - touchEndY;
      const deltaX = touchStartX - touchEndX;

      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && touchStartX < 50) {
          this.mobileFiltersOpen.set(true);
        } else if (deltaX < 0 && this.mobileFiltersOpen()) {
          this.mobileFiltersOpen.set(false);
        }
      }
    }, { passive: true });
  }

  // Mobile UI methods
  toggleMobileSearch(): void {
    this.mobileSearchExpanded.update(expanded => !expanded);
    if (this.mobileSearchExpanded() && isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const searchInput = this.document.querySelector('.mobile-search-input') as HTMLInputElement;
        searchInput?.focus();
      }, 300);
    }
  }

  toggleMobileFilters(): void {
    this.mobileFiltersOpen.update(open => !open);
  }

  closeMobileOverlays(): void {
    this.mobileSearchExpanded.set(false);
    this.mobileFiltersOpen.set(false);
  }

  // Navigation methods
  navigateToCreateNotification(): void {
    this.router.navigate(['/notifications/create']);
  }

  navigateToCreateNotificationForGame(game: any): void {
    this.router.navigate(['/notifications/create'], {
      queryParams: { gameId: game.id }
    });
  }

  navigateToEditNotification(notificationId: string): void {
    this.router.navigate(['/notifications/create'], {
      queryParams: { edit: true, id: notificationId }
    });
  }

  handleMobileGameSelection(game: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (isPlatformBrowser(this.platformId) && 'vibrate' in navigator && this.breakpoint().isMobile) {
      navigator.vibrate(50);
    }

    this.navigateToCreateNotificationForGame(game);
  }

  async toggleNotificationMobile(id: string, event?: Event): Promise<void> {
    event?.stopPropagation();

    if (isPlatformBrowser(this.platformId) && 'vibrate' in navigator && this.breakpoint().isMobile) {
      navigator.vibrate(100);
    }

    await this.toggleNotification(id);
  }

  // UI utility methods
  getGridColumns(): string {
    const bp = this.breakpoint();
    if (bp.isMobile) {
      return bp.orientation === 'portrait' ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)';
    } else if (bp.isTablet) {
      return 'repeat(2, 1fr)';
    } else {
      return 'repeat(auto-fill, minmax(300px, 1fr))';
    }
  }

  getSafeAreaTop(): string {
    if (isPlatformBrowser(this.platformId) && this.document.body.classList.contains('ios-device')) {
      return 'env(safe-area-inset-top, 0px)';
    }
    return '0px';
  }

  getSafeAreaBottom(): string {
    if (isPlatformBrowser(this.platformId) && this.document.body.classList.contains('ios-device')) {
      return 'env(safe-area-inset-bottom, 0px)';
    }
    return '0px';
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
  }

  // Selection management - FIXED
  toggleSelectionMode(): void {
    this.selectionMode.update(mode => !mode);
    if (!this.selectionMode()) {
      this.selectedNotifications.set([]);
    }
  }

  isNotificationSelected(id: string): boolean {
    return this.selectedNotifications().includes(id);
  }

  addSelectedNotification(id: string): void {
    const current = this.selectedNotifications();
    if (!current.includes(id)) {
      this.selectedNotifications.set([...current, id]);
    }
  }

  removeSelectedNotification(id: string): void {
    const current = this.selectedNotifications();
    this.selectedNotifications.set(current.filter(selectedId => selectedId !== id));
  }

  clearSelection(): void {
    this.selectedNotifications.set([]);
  }

  isGameSelected(id: string): boolean {
    return false;
  }
}

import {computed, Injectable, signal} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {BaseService} from "./base.service";
import {NotificationFilters} from '../model/notifications/NotificationFilters';
import {Page} from "../model/notifications/Page";
import {UserSubscription} from '../model/notifications/UserSubscription';
import {EventType} from '../model/notifications/EventType';
import {PageRequest} from "../model/notifications/PageRequest";
import {firstValueFrom, Observable} from 'rxjs';
import {catchError, retry, tap} from "rxjs/operators";
import {SportType} from "../model/SportType";
import {Game} from "../model/notifications/Game";

export interface CreateNotificationRequest {
  type: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  gameTime: string;
  sport: string;
  league: string;
  conditions: any;
  enabled: boolean;
}



export interface GamesParams {
  page?: number;
  size?: number;
}


export interface SubscriptionQueryParams {
  userId: string;
  sportType: SportType;
  eventType?: EventType;
  isEnabled?: boolean;
  league?: string;
  searchTerm?: string;
  pageRequest: PageRequest;
}

interface LoadSubscriptionsParams {
  userId: string;
  sportType?: SportType;
  eventType?: EventType;
  isEnabled?: boolean;
  pageRequest?: PageRequest;
}

enum ResourceStatus {
  Loading,
  Reloading,
  Loaded,
  Error
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService extends BaseService<UserSubscription> {

  // Simple data signals
  private readonly _pageData = signal<Page<UserSubscription> | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly pageData = this._pageData.asReadonly();
  readonly subscriptions = computed(() => this._pageData()?.content || []);
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Simple pagination signals
  readonly totalElements = computed(() => this._pageData()?.totalElements || 0);
  readonly totalPages = computed(() => this._pageData()?.totalPages || 0);
  readonly currentPage = computed(() => (this._pageData()?.number || 0) + 1);
  readonly pageSize = computed(() => this._pageData()?.size || 0);

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const userId = await this.initializeUser();
      if (userId) {
        await this.loadSubscriptions(userId);
      } else {
        throw new Error('User ID not available');
      }
    } catch (error) {
      this._error.set('Failed to initialize service');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Load subscriptions with filters - just pass everything to the API
   */
  async loadSubscriptions(
      userId: string,
      filters?: NotificationFilters,
      searchTerm?: string,
      page: number = 0,
      size: number = 8
  ): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const pageResponse = await firstValueFrom(
          this.getSubscriptions(userId, filters, searchTerm, page, size)
      );

      this._pageData.set(pageResponse || null);
    } catch (error) {
      this._pageData.set(null);
      this._error.set('Failed to load subscriptions');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Simple API call - build params and call backend
   */
  private getSubscriptions(
      userId: string,
      filters?: NotificationFilters,
      searchTerm?: string,
      page: number = 0,
      size: number = 8
  ): Observable<Page<UserSubscription>> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString());

    // Add filters if provided
    if (filters) {
      if (filters.sport !== 'all') params = params.set('sport', filters.sport);
      if (filters.type !== 'all') params = params.set('type', filters.type);
      if (filters.enabled !== 'all') params = params.set('enabled', filters.enabled);
      if (filters.league !== 'all') params = params.set('league', filters.league);
    }

    // Add search if provided
    if (searchTerm?.trim()) {
      params = params.set('searchTerm', searchTerm.trim());
    }

    const url = `${this.apiUrl}/api/v1/subscriptions/${userId}/getUserSubscriptions`;

    return this.http.get<Page<UserSubscription>>(url, {
      params: params,
      withCredentials: true
    }).pipe(
        retry({ count: 3, delay: 1000 }),
        tap(response => console.log('Loaded subscriptions:', response.content?.length)),
        catchError(error => {
          console.error('Failed to load subscriptions:', error);
          throw error;
        })
    );
  }

  /**
   * Create subscription
   */
  async createSubscription(subscription: UserSubscription): Promise<UserSubscription> {
    const url = `${this.apiUrl}/api/v1/subscriptions/createSubscription`;
    return await firstValueFrom(
        this.post<UserSubscription, UserSubscription>(url, subscription, 'Failed to create subscription')
    );
  }

  /**
   * Update subscription
   */
  async updateSubscription(id: string, subscription: UserSubscription): Promise<UserSubscription> {
    const url = `${this.apiUrl}/api/v1/subscriptions/${id}`;
    return await firstValueFrom(
        this.post<UserSubscription, UserSubscription>(url, subscription, 'Failed to update subscription')
    );
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(userId: string, subscriptionId: string): Promise<boolean> {
    const url = `${this.apiUrl}/api/v1/subscriptions/user/${userId}/subscription/${subscriptionId}`;
    return await firstValueFrom(
        this.get<boolean>(url, 'Failed to delete subscription')
    );
  }

  /**
   * Toggle subscription
   */
  async toggleSubscription(id: string): Promise<UserSubscription> {
    const subscription = this.subscriptions().find(sub => sub.id === id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const updated = { ...subscription, isEnabled: !subscription.isEnabled };
    return this.updateSubscription(id, updated);
  }

  /**
   * Get subscription by ID
   */
  getSubscriptionById(id: string): UserSubscription | undefined {
    return this.subscriptions().find(sub => sub.id === id);
  }

  /**
   * Refresh current data
   */
  async refresh(): Promise<void> {
    const userId = this.userIdSignal();
    if (userId) {
      await this.loadSubscriptions(userId);
    }
  }

  /**
   * Fetch live games with pagination
   * @param params - Pagination parameters (page, size)
   * @returns Observable of pageable response containing live games
   */
  getLiveGames(params: GamesParams = { page: 0, size: 5 }): Observable<Page<Game>> {
    const httpParams = new HttpParams()
        .set('page', params.page?.toString() || '0')
        .set('size', params.size?.toString() || '5');

    return this.http.get<Page<Game>>(`${this.apiUrl}/games/live`, { params: httpParams });
  }

  /**
   * Fetch upcoming games with pagination
   * @param params - Pagination parameters (page, size)
   * @returns Observable of pageable response containing upcoming games
   */
  getUpcomingGames(params: GamesParams = { page: 0, size: 5 }): Observable<Page<Game>> {
    const httpParams = new HttpParams()
        .set('page', params.page?.toString() || '0')
        .set('size', params.size?.toString() || '5');

    return this.http.get<Page<Game>>(`${this.apiUrl}/games/upcoming`, { params: httpParams });
  }

  /**
   * Fetch both live and upcoming games concurrently
   * @param liveParams - Pagination params for live games
   * @param upcomingParams - Pagination params for upcoming games
   * @returns Object with observables for both live and upcoming games
   */
  getAllGames(
      liveParams: GamesParams = { page: 0, size: 5 },
      upcomingParams: GamesParams = { page: 0, size: 5 }
  ) {
    return {
      live: this.getLiveGames(liveParams),
      upcoming: this.getUpcomingGames(upcomingParams)
    };
  }
}


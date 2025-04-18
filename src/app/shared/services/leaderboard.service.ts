import {Injectable, signal} from '@angular/core';
import {BaseService} from "./base.service";
import {LeaderboardData} from "../model/paper-betting/rankings/LeaderboardData";
import {environment} from "../../../environments/environment";
import {Observable, of} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService extends BaseService<LeaderboardData> {
  protected override apiUrl = `${environment.apiUrl}/paper-betting/v1`;
  initialized = signal<boolean>(false); // Track initialization status

  constructor() {
    super();
    this.initialize(); // Start initialization in constructor
  }

  private async initialize(): Promise<void> {
    const userId = await this.initializeUser(); // Call BaseService's initializeUser
    if (!userId) {
      this.errorMessage.set('Failed to initialize user');
      return;
    }
    this.initialized.set(true); // Mark initialization as complete
  }

  getLeaderboard(page: number, size: number): Observable<LeaderboardData | null> {
    if (!this.initialized()) {
      this.errorMessage.set('Service not initialized');
      return of(null);
    }

    const userId = this.userId(); // Access userId signal from BaseService
    if (!userId) {
      this.errorMessage.set('User not authenticated');
      return of(null);
    }

    return this.get<LeaderboardData>(
        `${this.apiUrl}/${userId}/leaderboards?page=${page}&size=${size}`,
        'Failed to load leaderboard'
    );
  }
}

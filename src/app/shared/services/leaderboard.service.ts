import {Injectable, signal} from '@angular/core';
import {BaseService} from "./base.service";
import {LeaderboardData} from "../model/paper-betting/rankings/LeaderboardData";
import {environment} from "../../../environments/environment";
import {Observable, of} from "rxjs";
import {LeaderRow} from "../model/paper-betting/rankings/LeaderRow";
import {LeaderboardResponse} from "../model/paper-betting/rankings/LeaderboardResponse";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService extends BaseService<LeaderRow> {
  protected override apiUrl = `${environment.apiUrl}/paper-betting/v1`;
  initialized = signal<boolean>(false);

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const userId = await this.initializeUser();
    if (!userId) {
      this.errorMessage.set('Failed to initialize user');
      return;
    }
    this.initialized.set(true);
  }

  getRankingsByPage(userId: string, page: number): Observable<LeaderboardResponse> {
    return this.get<any>(`${this.apiUrl}/${userId}/getRankings?page=${page}&size=${10}`,
        'Failed to load leaderboard'
    ).pipe(
        map(response => ({
          ...response,
          content: response.content.map((user: any) => this.transformLeaderRow(user))
        }))
    );
  }

  private transformLeaderRow(user: any): LeaderRow {
    return {
      id: user.id,
      username: user.username,
      totalBets: user.totalBets,
      betWins: user.betWins,
      betLosses: user.betLosses,
      winRate: user.winRate,
      totalAmount: user.totalAmount,
      rank: user.rank,
      statistics: {
        avgBetAmount: user.statistics.avg_wager || 0,
        highestWin: user.statistics.total_earnings || 0,
        favoriteCategory: user.statistics.favoriteCategory || 'N/A',
        avgOdds: user.statistics.avgOdds || 0
      },
      lastBets: (user.lastBets || []).map((bet: any) => ({
        id: bet.game_id,
        date: bet.creation_date,
        gameName: bet.game_name || '',
        selectedTeam: bet.selected_team || '',
        wagerAmount: bet.wager_amount || 0,
        wagerValue: bet.wager_value || 0,
        status: bet.status
      }))
    };
  }

  getLeaderboard(page: number, size: number): Observable<LeaderboardData | null> {
    if (!this.initialized()) {
      this.errorMessage.set('Service not initialized');
      return of(null);
    }

    const userId = this.userId();
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

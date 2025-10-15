import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { Game } from '../model/paper-betting/Game';
import { SportType } from '../model/SportType';
import { BaseService } from './base.service';
import { environment } from '../../../environments/environment';
import {Page} from "../model/notifications/Page";


export interface GameUpdate {
  gameId: number;
  timestamp: number;
}

/**
 * Shared service for ALL game fetching
 * Used by both PredictionsService and BetSettlementService
 */
@Injectable({
  providedIn: 'root'
})
export class GameService extends BaseService<Game> {
  protected override apiUrl = `${environment.apiUrl}/paper-betting/v1`;

  // Shared state
  readonly allGames = signal<Game[]>([]);

  private gameUpdateSubject = new Subject<GameUpdate>();
  readonly gameUpdate$ = this.gameUpdateSubject.asObservable();

  constructor() {
    super();
  }

  /**
   * Get paginated upcoming games
   */
  getUpcomingGamesPaginated(
      userId: string,
      league: SportType,
      page: number,
      resultsPerPage: number
  ): Observable<Page<Game>> {
    const leagueParam = this.convertSportTypeToLeague(league);
    const params = new HttpParams()
        .set('page', page.toString())
        .set('resultsPerPage', resultsPerPage.toString());

    return this.get<Page<Game>>(
        `${this.apiUrl}/${userId}/${leagueParam}/getUpcomingGames`,
        'Failed to load games',
        { params }
    ).pipe(
        tap(response => console.log(`Loaded ${response.content.length} games`)),
        catchError(error => {
          console.error(`Error loading games:`, error);
          throw error;
        })
    );
  }

  /**
   * Get paginated live/active games
   */
  getLiveGamesPaginated(
      userId: string,
      league: SportType,
      page: number,
      resultsPerPage: number
  ): Observable<Page<Game>> {
    const leagueParam = this.convertSportTypeToLeague(league);
    const params = new HttpParams()
        .set('page', page.toString())
        .set('resultsPerPage', resultsPerPage.toString());

    return this.get<Page<Game>>(
        `${this.apiUrl}/${userId}/${leagueParam}/getLiveGames`,
        'Failed to load live games',
        { params }
    ).pipe(
        tap(response => console.log(`Loaded ${response.content.length} live games`)),
        catchError(error => {
          console.error(`Error loading live games:`, error);
          throw error;
        })
    );
  }

  /**
   * Update a game and notify subscribers
   */
  updateGame(gameId: number, updater: (game: Game) => Game): void {
    this.allGames.update(games =>
        games.map(game => game.id === gameId ? updater(game) : game)
    );

    this.gameUpdateSubject.next({ gameId, timestamp: Date.now() });
  }

  /**
   * Sync games to cache
   */
  syncGames(games: Game[]): void {
    const currentGames = this.allGames();
    const updatedGames = [...currentGames];

    games.forEach(newGame => {
      const index = updatedGames.findIndex(g => g.id === newGame.id);
      if (index !== -1) {
        updatedGames[index] = newGame;
      } else {
        updatedGames.push(newGame);
      }
    });

    this.allGames.set(updatedGames);
  }

  private convertSportTypeToLeague(sportType: SportType): string {
    const mapping: Record<SportType, string> = {
      [SportType.NFL]: 'NFL',
      [SportType.NHL]: 'NHL',
      [SportType.NBA]: 'NBA',
      [SportType.MLB]: 'MLB',
      [SportType.ALL]: 'ALL',
      [SportType.MLS]: 'MLS',
      [SportType.EPL]: 'EPL',
      [SportType.UFC]: 'UFC',
      [SportType.PGA]: 'PGA',
      [SportType.WTA]: 'WTA',
      [SportType.NASCAR]: 'NASCAR',
      [SportType.NCAA_FOOTBALL]: 'NCAAF',
      [SportType.NCAA_BASKETBALL]: 'NCAAB',
      [SportType.SOCCER]: 'SOCCER'
    };
    return mapping[sportType] || 'NFL';
  }
}

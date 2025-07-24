import { Injectable } from '@angular/core';
import {Game} from "../../model/notifications/Game";

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private upcomingGames: Game[] = [
    { id: 'bal-cle', home: 'CLE', away: 'BAL', homeScore: '', awayScore: '', time: '6:40 PM ET', homeRecord: '40-50', awayRecord: '44-55', status: 'upcoming', league: 'MLB' },
    { id: 'det-pit', home: 'PIT', away: 'DET', homeScore: '', awayScore: '', time: '6:40 PM ET', homeRecord: '40-61', awayRecord: '50-41', status: 'upcoming', league: 'MLB' },
    { id: 'sd-mia', home: 'MIA', away: 'SD', homeScore: '', awayScore: '', time: '6:40 PM ET', homeRecord: '45-53', awayRecord: '55-45', status: 'upcoming', league: 'MLB' },
    { id: 'bos-phi', home: 'PHI', away: 'BOS', homeScore: '', awayScore: '', time: '6:45 PM ET', homeRecord: '57-43', awayRecord: '54-48', status: 'upcoming', league: 'MLB' },
    { id: 'cin-wsh', home: 'WSH', away: 'CIN', homeScore: '', awayScore: '', time: '6:46 PM ET', homeRecord: '40-60', awayRecord: '52-49', status: 'upcoming', league: 'MLB' },
    { id: 'chw-tb', home: 'TB', away: 'CHW', homeScore: '', awayScore: '', time: '7:05 PM ET', homeRecord: '52-49', awayRecord: '35-65', status: 'upcoming', league: 'MLB' }
  ];

  private activeGames: Game[] = [
    { id: 'lal-gsw-live', home: 'GSW', away: 'LAL', homeScore: '89', awayScore: '92', time: 'Q3 8:24', homeRecord: '35-47', awayRecord: '42-40', status: 'live', league: 'NBA' },
    { id: 'bos-mia-live', home: 'MIA', away: 'BOS', homeScore: '76', awayScore: '81', time: 'Q3 5:12', homeRecord: '44-38', awayRecord: '57-25', status: 'live', league: 'NBA' }
  ];

  getUpcomingGames(): Game[] {
    return [...this.upcomingGames];
  }

  getActiveGames(): Game[] {
    return [...this.activeGames];
  }

  getGameById(id: string): Game | undefined {
    return [...this.upcomingGames, ...this.activeGames].find(game => game.id === id);
  }
}

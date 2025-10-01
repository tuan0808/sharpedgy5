import { Injectable } from '@angular/core';
import {Player} from "../model/paper-betting/Player";
import {StatsData} from "../model/paper-betting/StatsData";

@Injectable({
  providedIn: 'root'
})
export class BettingRankingsService {
  private generatePlayers(count: number): Player[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      earnings: Math.floor(100000 + Math.random() * 900000),
      winPercentage: Math.floor(50 + Math.random() * 40),
      totalBets: Math.floor(100 + Math.random() * 500),
      avgBetSize: Math.floor(100 + Math.random() * 900),
      streak: Math.floor(Math.random() * 15),
      bestCategory: ['Sports', 'Politics', 'Entertainment', 'Finance'][Math.floor(Math.random() * 4)],
      lastActivity: `${Math.floor(1 + Math.random() * 14)} days ago`,
      open: false
    }))
        .sort((a, b) => b.earnings - a.earnings)
        .map((player, index) => ({
          ...player,
          id: index + 1
        }));
  }

  getInitialPlayers(): Player[] {
    return this.generatePlayers(50);
  }

  getCurrentUser(): Player {
    return {
      id: 0,
      earnings: Math.floor(50000 + Math.random() * 400000),
      winPercentage: Math.floor(50 + Math.random() * 40),
      totalBets: Math.floor(100 + Math.random() * 500),
      avgBetSize: Math.floor(100 + Math.random() * 900),
      streak: Math.floor(Math.random() * 15),
      bestCategory: ['Sports', 'Politics', 'Entertainment', 'Finance'][Math.floor(Math.random() * 4)],
      lastActivity: "Today",
      name: "Michael Johnson",
      isCurrentUser: true,
      open: false
    };
  }

  getStatsData(): StatsData {
    return {
      totalPool: 28500000,
      activeBettors: 2451,
      highestWinRate: 89.2,
      totalBetsPlaced: 86329
    };
  }
}

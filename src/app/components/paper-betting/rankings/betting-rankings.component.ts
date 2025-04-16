import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Bet {
  id: number;
  date: string;
  amount: number;
  result: string;
  odds: number;
  event: string;
}

interface Statistics {
  avgBetAmount: number;
  highestWin: number;
  favoriteCategory: string;
  avgOdds: number;
}

interface User {
  id: number;
  username: string;
  rank?: number;
  totalBets: number;
  wonBets: number;
  winRate: number;
  totalAmount: number;
  lastBets: Bet[];
  statistics: Statistics;
}

@Component({
  selector: 'app-betting-rankings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './betting-rankings.component.html',
  styleUrls: ['./betting-rankings.component.scss']
})
export class BettingRankingsComponent {
  currentUser: User = {
    id: 3,
    username: "RiskTaker77",
    rank: 3,
    totalBets: 315,
    wonBets: 152,
    winRate: 48.3,
    totalAmount: 9870,
    lastBets: [
      { id: 1, date: "2025-04-16", amount: 350, result: "loss", odds: 4.5, event: "Underdog MMA Fight" },
      { id: 2, date: "2025-04-14", amount: 200, result: "win", odds: 3.2, event: "Horse Racing - Derby" },
      { id: 3, date: "2025-04-12", amount: 150, result: "loss", odds: 2.8, event: "Tennis Grand Slam" }
    ],
    statistics: {
      avgBetAmount: 210.75,
      highestWin: 1200,
      favoriteCategory: "Horse Racing",
      avgOdds: 3.45
    }
  };

  users: User[] = [
    {
      id: 1,
      username: "BetMaster99",
      totalBets: 427,
      wonBets: 245,
      winRate: 57.4,
      totalAmount: 15420,
      lastBets: [
        { id: 1, date: "2025-04-15", amount: 200, result: "win", odds: 1.8, event: "Lakers vs. Bulls" },
        { id: 2, date: "2025-04-14", amount: 150, result: "loss", odds: 2.5, event: "Man City vs. Arsenal" },
        { id: 3, date: "2025-04-13", amount: 300, result: "win", odds: 1.5, event: "Federer vs. Nadal" }
      ],
      statistics: {
        avgBetAmount: 145.50,
        highestWin: 950,
        favoriteCategory: "Basketball",
        avgOdds: 2.34
      }
    },
    {
      id: 2,
      username: "LuckyStreak42",
      totalBets: 382,
      wonBets: 201,
      winRate: 52.6,
      totalAmount: 12750,
      lastBets: [
        { id: 1, date: "2025-04-15", amount: 100, result: "win", odds: 2.1, event: "Real Madrid vs. Barcelona" },
        { id: 2, date: "2025-04-12", amount: 250, result: "win", odds: 1.7, event: "Yankees vs. Red Sox" },
        { id: 3, date: "2025-04-10", amount: 175, result: "loss", odds: 3.0, event: "UFC 298: Main Event" }
      ],
      statistics: {
        avgBetAmount: 120.30,
        highestWin: 750,
        favoriteCategory: "Soccer",
        avgOdds: 2.15
      }
    },
    {
      id: 3,
      username: "RiskTaker77",
      totalBets: 315,
      wonBets: 152,
      winRate: 48.3,
      totalAmount: 9870,
      lastBets: [
        { id: 1, date: "2025-04-16", amount: 350, result: "loss", odds: 4.5, event: "Underdog MMA Fight" },
        { id: 2, date: "2025-04-14", amount: 200, result: "win", odds: 3.2, event: "Horse Racing - Derby" },
        { id: 3, date: "2025-04-12", amount: 150, result: "loss", odds: 2.8, event: "Tennis Grand Slam" }
      ],
      statistics: {
        avgBetAmount: 210.75,
        highestWin: 1200,
        favoriteCategory: "Horse Racing",
        avgOdds: 3.45
      }
    },
    {
      id: 4,
      username: "SmartBettor23",
      totalBets: 289,
      wonBets: 172,
      winRate: 59.5,
      totalAmount: 8320,
      lastBets: [
        { id: 1, date: "2025-04-15", amount: 125, result: "win", odds: 1.5, event: "Premier League Match" },
        { id: 2, date: "2025-04-13", amount: 175, result: "win", odds: 1.8, event: "NBA Playoffs" },
        { id: 3, date: "2025-04-11", amount: 200, result: "loss", odds: 2.2, event: "Formula 1 Grand Prix" }
      ],
      statistics: {
        avgBetAmount: 110.50,
        highestWin: 680,
        favoriteCategory: "Soccer",
        avgOdds: 1.85
      }
    },
    {
      id: 5,
      username: "BigStakes365",
      totalBets: 256,
      wonBets: 132,
      winRate: 51.6,
      totalAmount: 21540,
      lastBets: [
        { id: 1, date: "2025-04-16", amount: 500, result: "win", odds: 2.0, event: "Boxing Championship" },
        { id: 2, date: "2025-04-14", amount: 750, result: "loss", odds: 3.5, event: "Cricket World Cup" },
        { id: 3, date: "2025-04-12", amount: 1000, result: "win", odds: 1.6, event: "NFL Game" }
      ],
      statistics: {
        avgBetAmount: 450.25,
        highestWin: 2000,
        favoriteCategory: "Boxing",
        avgOdds: 2.45
      }
    }
  ];

  expandedUser: number | null = null;
  expandedCurrentUser: boolean = false;
  activePeriod: string = 'Overall';
  filterPeriods: string[] = ['Overall', 'Year', 'Month', 'Week'];

  toggleAccordion(userId: number): void {
    this.expandedUser = this.expandedUser === userId ? null : userId;
  }

  toggleCurrentUserAccordion(): void {
    this.expandedCurrentUser = !this.expandedCurrentUser;
  }

  setActivePeriod(period: string): void {
    this.activePeriod = period;
  }

  getWinRateClass(winRate: number): string {
    if (winRate > 55) return 'text-green-600';
    if (winRate < 50) return 'text-red-600';
    return 'text-yellow-600';
  }

  getResultClass(result: string): string {
    return result === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getRankClass(index: number): string {
    switch (index) {
      case 0:
        return 'text-yellow-500'; // Gold for rank 1
      case 1:
        return 'text-gray-400'; // Silver for rank 2
      case 2:
        return 'text-amber-600'; // Bronze for rank 3
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  getCurrentUserIndex(): number {
    return this.users.findIndex(u => u.id === this.currentUser.id);
  }
}

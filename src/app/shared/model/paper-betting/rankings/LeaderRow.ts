import {Statistics} from "./Statistics";
import {Bet} from "./Bet";
import {LastBet} from "./LastBet";

export interface  LeaderRow {
    id: number; // e.g., 30
    username: string; // e.g., "Ryan Kilpatrick"
    totalBets: number; // e.g., 3
    betWins: number; // e.g., 3
    betLosses: number; // e.g., 0
    winRate: number; // e.g., 100.0
    totalAmount: number; // e.g., 2339.00
    rank?: number; // Optional, as not explicitly in API but used in template
    statistics: Statistics;
    lastBets: LastBet[];
}

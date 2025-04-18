import {Statistics} from "./Statistics";
import {Bet} from "./Bet";

export interface LeaderRow {
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

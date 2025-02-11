export interface BettingHistory {
    date: string;
    type: string;
    amount: number;
    result: 'win' | 'loss';
    profit: number;
}

export interface Player {
    id: number;
    name: string;
    earnings: number;
    winPercentage: number;
    totalBets: number;
    avgBetSize: number;
    streak: number;
    bestCategory: string;
    lastActivity: string;
    open: boolean;
    isCurrentUser?: boolean;
}

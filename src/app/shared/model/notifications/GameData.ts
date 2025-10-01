export interface GameData {
    id: string;
    sportType: string;
    homeTeam: string;
    awayTeam: string;
    scheduledTime: string;
    status: string;
    homeScore?: number;
    awayScore?: number;
    currentPeriod?: string;
    timeRemaining?: string;
    createdAt: string;
    updatedAt: string;
}

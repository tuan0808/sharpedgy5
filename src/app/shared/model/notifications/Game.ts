export interface Game {
    id: number;
    awayTeam: string;
    homeTeam: string;
    scheduledTime: string;
    league: string;
    status?: string;
    awayScore?: number;
    homeScore?: number;
    // Add other game properties as needed
}

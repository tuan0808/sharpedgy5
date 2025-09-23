export interface Notification {
    id: number;
    type: string;
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    gameDate: string;
    gameTime: string;
    sport: string;
    league: string;
    enabled: boolean;
    conditions: any;
    lastTriggered: string;
    triggerCount: number;
    season: string;
    priority: number;
    savings: number;
}

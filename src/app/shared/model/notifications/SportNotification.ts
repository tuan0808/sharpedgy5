export interface SportNotification {
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
    conditions: {
        threshold?: number;
        direction?: string;
        market?: string;
        quarter?: string;
        timeRemaining?: string;
    };
    lastTriggered: string;
    triggerCount: number;
    season: string;
    priority: number;
    savings: number;
}

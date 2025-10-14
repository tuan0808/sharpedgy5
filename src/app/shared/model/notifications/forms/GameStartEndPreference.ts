export interface GameStartEndPreferences {
    gameStart: boolean;
    gameEnd: boolean;
    includeStats: boolean;
    preGameReminder: string | null;
    finalScoreDelay: string | null;
}

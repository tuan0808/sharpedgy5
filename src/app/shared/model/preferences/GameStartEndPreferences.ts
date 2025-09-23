export interface GameStartEndPreferences {
    gameStart: boolean;
    gameEnd: boolean;
    preGameReminder?: '5_MINUTES' | '15_MINUTES' | '30_MINUTES' | '1_HOUR';
    finalScoreDelay?: '0_MINUTES' | '2_MINUTES' | '5_MINUTES' | '10_MINUTES';
}

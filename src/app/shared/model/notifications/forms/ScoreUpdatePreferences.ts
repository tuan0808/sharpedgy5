export interface ScoreUpdatePreferences {
    incrementThreshold: number;
    realTimeUpdates: boolean;
    onlySignificantScores: boolean;
    quarterEnd: boolean;
    halfTime: boolean;
    periodEnd: boolean;
    overtime: boolean;
    twoMinuteWarning: boolean;
}

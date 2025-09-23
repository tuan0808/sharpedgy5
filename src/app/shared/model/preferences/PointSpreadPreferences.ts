export interface PointSpreadPreferences {
    threshold: number;
    alertOnIncrease: boolean;
    alertOnDecrease: boolean;
    minimumGameTime: '15_MINUTES_BEFORE' | '30_MINUTES_BEFORE' | '1_HOUR_BEFORE' | '2_HOURS_BEFORE';
}

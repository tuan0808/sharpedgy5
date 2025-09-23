export interface BettingVolumeSpikePreferences {
    volumeThreshold: number;
    timeWindow: '5_MINUTES' | '15_MINUTES' | '30_MINUTES' | '1_HOUR';
}

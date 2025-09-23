import {DEFAULT_PREFERENCES, NotificationSettings} from "./NotificationSettings";

export class NotificationPreferencesHelper {
    static getPreferencesForType(type: string): any {
        switch (type) {
            case 'Point Spread Diff':
                return { ...DEFAULT_PREFERENCES.pointSpread };
            case 'Betting Volume Spike':
                return { ...DEFAULT_PREFERENCES.bettingVolumeSpike };
            case 'Score Update':
                return { ...DEFAULT_PREFERENCES.scoreUpdate };
            case 'Moneyline Odds':
                return { ...DEFAULT_PREFERENCES.moneyLine };
            case 'Over/Under':
                return { ...DEFAULT_PREFERENCES.overUnder };
            case 'ScheduledGame Start/End':
                return { ...DEFAULT_PREFERENCES.gameStartEnd };
            case 'Final Score':
                return { ...DEFAULT_PREFERENCES.finalScore };
            case 'ScheduledGame Milestones':
                return { ...DEFAULT_PREFERENCES.gameMilestones };
            default:
                return {};
        }
    }

    static getPreferenceKey(type: string): keyof NotificationSettings['preferences'] | null {
        switch (type) {
            case 'Point Spread Diff':
                return 'pointSpread';
            case 'Betting Volume Spike':
                return 'bettingVolumeSpike';
            case 'Score Update':
                return 'scoreUpdate';
            case 'Moneyline Odds':
                return 'moneyLine';
            case 'Over/Under':
                return 'overUnder';
            case 'ScheduledGame Start/End':
                return 'gameStartEnd';
            case 'Final Score':
                return 'finalScore';
            case 'ScheduledGame Milestones':
                return 'gameMilestones';
            default:
                return null;
        }
    }
}

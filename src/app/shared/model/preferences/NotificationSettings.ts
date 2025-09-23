import { BettingVolumeSpikePreferences } from "./BettingVolumeSpikePreferences ";
import {PointSpreadPreferences} from "./PointSpreadPreferences";
import {ScoreUpdatePreferences} from "./ScoreUpdatePreferences";
import {MoneyLinePreferences} from "./MoneyLinePreferences";
import {OverUnderPreferences} from "./OverUnderPreferences";
import {GameStartEndPreferences} from "./GameStartEndPreferences";
import {FinalScorePreferences} from "./FinalScorePreferences";
import {GameMilestonesPreferences} from "./GameMilestonesPreferences";

export interface NotificationSettings {
    sensitivity: 'low' | 'medium' | 'high';
    gameHoursOnly: boolean;
    enableImmediately: boolean;
    autoDisable: boolean;
    preferences: {
        pointSpread?: PointSpreadPreferences;
        bettingVolumeSpike?: BettingVolumeSpikePreferences;
        scoreUpdate?: ScoreUpdatePreferences;
        moneyLine?: MoneyLinePreferences;
        overUnder?: OverUnderPreferences;
        gameStartEnd?: GameStartEndPreferences;
        finalScore?: FinalScorePreferences;
        gameMilestones?: GameMilestonesPreferences;
    };
}

// Default preferences for each notification type
export const DEFAULT_PREFERENCES = {
    pointSpread: {
        threshold: 2.5,
        alertOnIncrease: true,
        alertOnDecrease: true,
        minimumGameTime: '30_MINUTES_BEFORE' as const
    },
    bettingVolumeSpike: {
        volumeThreshold: 200.0,
        timeWindow: '15_MINUTES' as const
    },
    scoreUpdate: {
        incrementThreshold: 7,
        realTimeUpdates: true,
        onlySignificantScores: false
    },
    moneyLine: {
        threshold: 15.0,
        trackFavoriteShift: true,
        trackUnderdogShift: true,
        minimumOddsValue: 100.0
    },
    overUnder: {
        threshold: 1.5,
        alertOnIncrease: true,
        alertOnDecrease: true
    },
    gameStartEnd: {
        gameStart: true,
        gameEnd: true,
        preGameReminder: undefined,
        finalScoreDelay: undefined
    },
    finalScore: {
        includeStats: false,
        delayAfterGameEnd: '2_MINUTES' as const
    },
    gameMilestones: {
        quarterEnd: false,
        halfTime: false,
        periodEnd: false,
        overtime: true,
        twoMinuteWarning: false
    }
};

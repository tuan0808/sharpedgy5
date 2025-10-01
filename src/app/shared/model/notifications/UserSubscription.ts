import {SportType} from "../SportType";
import {EventType} from "./EventType";
import {EventStatus} from "../../../components/notifications/create-notification/create-notification.component";
import {ScheduledGame} from "./ScheduledGame";
import {QuietHours} from "./QuietHours";

export interface UserSubscription {
    id?: string;
    userId: string;
    sportType: SportType;
    state: EventStatus;
    game : ScheduledGame,
    eventType: EventType;
    isEnabled: boolean;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    preferences: string; // JSON string
    quietHours: QuietHours[];

    // Additional fields that might be computed/joined from ScheduledGame entity
    homeTeam: string;
    awayTeam: string;
    gameDate: string;
    gameTime: string;
    league: string;
    // Additional fields for UI/business logic
    lastTriggered?: string | null;
    triggerCount: number;
    priority: number;
    savings: number;

    // Optional scores for live games
    homeScore?: number;
    awayScore?: number;
}

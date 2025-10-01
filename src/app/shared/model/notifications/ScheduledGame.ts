import {EventStatus} from "./EventStatus";
import {SportType} from "../SportType";

export interface ScheduledGame {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    scheduledTime: string;
    Home?: string;
    awayRecord?: string;
    status: EventStatus;
    league: string;
    sport: SportType;
}

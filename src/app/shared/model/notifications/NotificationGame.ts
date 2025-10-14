import {EventStatus} from "./EventStatus";

export interface NotificationGame {
    id: string;
    sportType: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: string;
    awayScore: string;
    scheduledTime: string;
    homeRecord: string;
    awayRecord: string;
    status: EventStatus;
}

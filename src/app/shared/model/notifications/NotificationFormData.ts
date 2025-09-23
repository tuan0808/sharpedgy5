import { NotificationSettings } from "./NotificationSettings";
import {ScheduledGame} from "./ScheduledGame";

export interface NotificationFormData {
    selectedGames: ScheduledGame[];
    notificationType: string;
    settings: NotificationSettings;
    threshold?: number;
}

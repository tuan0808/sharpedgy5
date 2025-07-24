import { NotificationSettings } from "./NotificationSettings";
import {Game} from "./Game";

export interface NotificationFormData {
    selectedGames: Game[];
    notificationType: string;
    settings: NotificationSettings;
    threshold?: number;
}

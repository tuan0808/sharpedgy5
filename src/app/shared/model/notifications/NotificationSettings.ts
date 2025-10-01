export interface NotificationSettings {
    sensitivity: 'low' | 'medium' | 'high';
    gameHoursOnly: boolean;
    enableImmediately: boolean;
    autoDisable: boolean;
}

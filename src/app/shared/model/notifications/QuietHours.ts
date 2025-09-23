export interface QuietHours {
    id?: string;
    startTime: string; // Format: "HH:mm" (e.g., "22:00")
    endTime: string;   // Format: "HH:mm" (e.g., "08:00")
    timeZone: string;  // Timezone string (e.g., "UTC", "America/New_York")
    enabled: boolean;
    creationDate: string; // ISO date string
    subscriptionId?: string; // Foreign key reference
}

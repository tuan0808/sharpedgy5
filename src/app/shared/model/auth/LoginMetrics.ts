export interface LoginMetrics {
    attempts: number;
    lastAttempt: number;
    lockoutUntil?: number;
}

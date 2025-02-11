export interface AuthCache {
    uid: string;
    timestamp: number;
    expiresAt: number;
    refreshToken?: string;
}

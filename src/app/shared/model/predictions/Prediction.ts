import {SportType} from "../SportType";

export class Prediction {
    id?: number;
    userId?: string;
    gameId?: string; // UUID will be string in TypeScript/JSON
    selectedTeam?: string;
    confidence?: number;
    sport?: SportType;
    creationDate?: string; // ISO string (e.g., "2025-04-02T12:00:00")
    gameStart?: string; // ISO string
    betType?: number;
    note?: string;
    status?: number;
    wagerValue?: number;
}

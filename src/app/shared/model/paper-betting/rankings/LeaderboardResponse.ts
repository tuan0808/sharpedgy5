import {LeaderRow} from "./LeaderRow";

export interface LeaderboardResponse {
    content: LeaderRow[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    first: boolean;
    empty: boolean;
}

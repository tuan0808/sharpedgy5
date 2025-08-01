export interface Game {
    id: string;
    home: string;
    away: string;
    homeScore: string;
    awayScore: string;
    time: string;
    date: string;
    homeRecord: string;
    awayRecord: string;
    status: 'upcoming' | 'live';
    league: string;
}

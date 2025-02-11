export interface Venue {
    name: string;
    city: string;
    state: string;
}

export interface Team {
    name: string;
    logo : string;
}
export interface Broadcast {
    network: string;
}

export interface Spread {
    favorite: string;
    points: string;
}

export interface Moneyline {
    homeOdds: string;
    awayOdds: string;
}

export interface OverUnder {
    total: string;
}

export interface Betting {
    spread: Spread;
    moneyline: Moneyline;
    overUnder: OverUnder;
}

export interface NFLGame {
    id: string;
    status: string;
    scheduled: string;
    venue: Venue;
    homeTeam: Team;
    awayTeam: Team;
    broadcast: Broadcast;
    betting: Betting;
}

export interface NFLSeason {
    league: string;
    season: string;
    week: string;
    games: NFLGame[];
}

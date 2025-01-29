export enum SportConfig {
    NBA = 'us.match.nba.score',
    NFL = 'us.match.nfl.score',
    MLB = 'us.match.mlb.score',
    SOCCER = 'global.match.soccer.score'
}

// Utility function to get sport name from enum
export function getSportName(sport: SportConfig): string {
    switch (sport) {
        case SportConfig.NBA:
            return 'NBA';
        case SportConfig.NFL:
            return 'NFL';
        case SportConfig.MLB:
            return 'MLB';
        case SportConfig.SOCCER:
            return 'Soccer';
        default:
            return 'Unknown';
    }
}

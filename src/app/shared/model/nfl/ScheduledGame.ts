import {Team} from "./TeamData";
import {StadiumDetail} from "./StadiumDetail";

export class ScheduledGame {
    GameKey: string;
    SeasonType: number;
    Season: number;
    Week: number;
    Date: Date;
    AwayTeam: Team;
    HomeTeam: Team;
    Channel: string;
    PointSpread: number;
    OverUnder: number;
    StadiumID: number;
    Canceled: boolean;
    GeoLat?: number;
    GeoLong?: number;
    ForecastTempLow: number;
    ForecastTempHigh: number;
    ForecastDescription: string;
    ForecastWindChill: number;
    ForecastWindSpeed: number;
    AwayTeamMoneyLine: number;
    HomeTeamMoneyLine: number;
    Day: string;
    DateTime: Date;
    GlobalGameID: number;
    GlobalAwayTeamID: number;
    GlobalHomeTeamID: number;
    ScoreID: number;
    Status: string;
    IsClosed?: boolean;
    DateTimeUTC: string;
    StadiumDetails: StadiumDetail;
}

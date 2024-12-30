import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, shareReplay} from "rxjs";
import {map} from "rxjs/operators";
import nflTeams from "../../../assets/data/NFLTeams.json"
import {formatDate} from "@angular/common";
import {Week} from "../model/Week";
import nflPositions from "../../../assets/data/NFLPositions.json"
import {ScheduledGame} from "../model/nfl/ScheduledGame";


@Injectable({
  providedIn: 'root'
})
export class NflDataService {
  private apiKey = '7aa548651a2e44d9bb7cd74a73cb1b75';
  private endpoint = 'https://api.sportsdata.io';

  constructor(private httpClient: HttpClient) {
  }

  /**
   * GET Are Games In Progress * Returns true if there is at least one game being played at the time of the request or false if there are none. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 5 Seconds * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/AreAnyGamesInProgress
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 SECONDS
   !!removeMe
   */
  async getAreGamesInProgress(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/AreAnyGamesInProgress?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Bye Weeks * Get bye weeks for the teams during a specified NFL season. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/Byes/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season

   */
  async getByeWeeks(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/Byes/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Week Current * Year of the current NFL season. This value changes at the start of the new NFL league year. The earliest season for Fantasy data is 2001. The earliest season for Team data is 1985. The earliest season for Fantasy data is 2001. The earliest season for Team data is 1985. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/CurrentSeason
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   !!removeMe
   */
  async getSeasonCurrent(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/CurrentSeason?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Week Last Completed * Year of the most recently completed season. this value changes immediately after the Super Bowl. The earliest season for Fantasy data is 2001. The earliest season for Team data is 1985. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/LastCompletedSeason
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   !!removeMe
   */
  async getSeasonLastCompleted(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/LastCompletedSeason?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Week Upcoming * Year of the current NFL season, if we are in the mid-season. If we are in the off-season, then year of the next upcoming season. This value changes immediately after the Super Bowl. The earliest season for Fantasy data is 2001. The earliest season for Team data is 1985. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/UpcomingSeason
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   !!removeMe
   */
  async getSeasonUpcoming(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/UpcomingSeason?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Week Current * Number of the current week of the NFL season. This value usually changes on Tuesday nights or Wednesday mornings at midnight ET. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/CurrentWeek
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   !!removeMe
   */
  async getWeekCurrent(): Promise<Observable<number>> {
    return this.httpClient.get<number>(`${this.endpoint}/v3/nfl/scores/json/CurrentWeek?key=${this.apiKey}`, {}).pipe(map((data: any) => {
      return data;
    }));
  }

  /**
   * GET Week Last Completed * Number of the last completed week of the NFL season. This value usually changes on Tuesday nights or Wednesday mornings at midnight ET. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/LastCompletedWeek
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   !!removeMe
   */
  async getWeekLastCompleted(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/LastCompletedWeek?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Week Upcoming * Number of the upcoming week of the NFL season. This value usually changes on Tuesday nights or Wednesday mornings at midnight ET. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/UpcomingWeek
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   !!removeMe
   */
  async getWeekUpcoming(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/UpcomingWeek?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET News * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/News
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   !!removeMe
   */
  async getNews(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/News?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET News by FunctionExtensions * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/NewsByDate/{date}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   * @param date

   */
  async getNewsbyDate(date: Date): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/NewsByDate/${date}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET News by Player * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/NewsByPlayerID/{playerid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   * @param playerid

   */
  async getNewsbyPlayer(playerid: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/NewsByPlayerID/${playerid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET News by Team * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/NewsByTeam/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   * @param team

   */
  async getNewsbyTeam(team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/NewsByTeam/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }

  async getScheduleTest(year: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`../../assets/data/NFLSeasons.json`, {}).pipe(map((data: any[]) => {
      return data.map(m => m)
    }));
  }

  async getWeekSchedule(): Promise<Observable<Week[]>> {
    return this.httpClient.get<Week[]>(`../../assets/data/NFLSeasons.json`, {}).pipe(map((data: any[]) => {
      return data.map(m => new Week(m.week, new Date(m.start_date), new Date(m.end_date), m.month))
    }));
  }


  /**
   * GET Players by Available * Tags: Rosters & Profiles Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/PlayersByAvailable
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   !!removeMe
   */
  async getPlayersbyAvailable(filter : string = ""): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/PlayersByAvailable?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      if (filter != "") {
        return data.filter(f => f.Active)
            .filter(f=>f.Team === filter)
            .map(m =>{
              m.Position = nflPositions.find(fi=>fi.shorthand === m.Position)
              return m
            })
      }
      return data.filter(f => f.Active)
          .map(m =>{
            m.Position = nflPositions.find(fi=>fi.shorthand === m.Position)
            return m
          })

    }));
  }

  async getPlayerById(id: number) {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/PlayersByAvailable?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      let result = data.find(f => f.PlayerID === id)
      result.Position = nflPositions.find(fi=>fi.shorthand === result.Position)
      return result;
    }));
  }


  /**
   * GET Players by Free Agent * Tags: Rosters & Profiles Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/PlayersByFreeAgents
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   !!removeMe
   */
  async getPlayersbyFreeAgent(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/PlayersByFreeAgents?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Players by Rookie Draft Year * Tags: Rosters & Profiles Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/PlayersByRookieDraftYear/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season

   */
  async getPlayersbyRookieDraftYear(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/PlayersByRookieDraftYear/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Players by Team * Tags: Rosters & Profiles Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/PlayersBasic/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param team

   */
  async getPlayersbyTeam(team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/PlayersBasic/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Details by Team * Tags: Depth Charts Feeds, Injuries Feeds, Rosters & Profiles Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/Players/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param team

   */
  async getPlayerDetailsbyTeam(team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/Players/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Referees * Returns full list of NFL Referees * Tags: Referee Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/Referees
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   !!removeMe
   */
  async getReferees(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/Referees?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Schedules * Game schedule for a specified season. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/SchedulesBasic/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   * @param season

   * @param week
   */
  async getSchedules(season: number, week: number): Promise<Observable<Map<string, ScheduledGame[]>>> {
    return this.httpClient.get<ScheduledGame[]>(`${this.endpoint}/v3/nfl/scores/json/Schedules/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      let results = data
          .filter(f => f.Week === week && f.GameKey != null)
          .map(d => {
            d.HomeTeam = nflTeams.find(f => f.Abbreviation === d.HomeTeam)
            d.AwayTeam = nflTeams.find(f => f.Abbreviation === d.AwayTeam)
            return d

          })
      return Map.groupBy(results, gb => formatDate(gb.Date, 'yyyy-MM-dd', 'en-US').toString())

    }));
  }


  /**
   * GET Scores by Week * Get game scores for a specified week of a season. * Tags: Game State Feeds, Scores Feeds * Recommended Call Interval: 5 Seconds * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/ScoresBasic/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 SECONDS
   * @param season
   , * @param week

   */
  async getScoresbyWeek(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/ScoresBasic/${season}/${week}?key=${this.apiKey}`, {}).pipe(
        map((data: any[]) => {
          return data.map(m=>{
            m.HomeTeam = nflTeams.find(f => f.Abbreviation === m.HomeTeam)
            m.AwayTeam = nflTeams.find(f => f.Abbreviation === m.AwayTeam)
            console.log(m)
            return m
          })

        }));
  }


  /**
   * GET Stadiums * This method returns all stadiums. * Tags: Teams, Stadiums & Coaches Feeds * Recommended Call Interval: 4 Hours * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/Stadiums
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 4 HOURS
   !!removeMe
   */
  async getStadiums(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/Stadiums?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Standings * Tags: Standings Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/Standings/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season

   */
  async getStandings(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/Standings/${season}?key=${this.apiKey}`, {}).pipe(
        map((data: any[]) => {
          data.map(m=>m.Team = nflTeams.find(f => f.Abbreviation === m.Team)
          )
          return data;
        })
    );
  }


  /**
   * GET Teams (Active) * Gets all active teams. * Tags: Teams, Stadiums & Coaches Feeds * Recommended Call Interval: 4 Hours * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/Teams
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 4 HOURS
   !!removeMe
   */
  async getTeamsActive(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/Teams?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Teams (All) * Gets all teams, including pro bowl teams. * Tags: Teams, Stadiums & Coaches Feeds * Recommended Call Interval: 4 Hours * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/AllTeams
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 4 HOURS
   !!removeMe
   */
  async getTeamsAll(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/AllTeams?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Teams * Gets all teams, including pro bowl teams. * Tags: Teams, Stadiums & Coaches Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/TeamsBasic
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   !!removeMe
   */
  async getTeams(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/Teams?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      data.map(m=>{
        m.PrimaryColor = `#${m.PrimaryColor}`
        m.SecondaryColor = `#${m.SecondaryColor}`
        m.Team = nflTeams.find(f => f.Abbreviation === m.Key)
      })
      return data;
    }));
  }


  /**
   * GET Depth Charts * Depth charts for all NFL teams split by offensive, defensive, and special teams position groupings. * Tags: Depth Charts Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/DepthCharts
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   !!removeMe
   */
  async getDepthCharts(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/DepthCharts?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Team Game Logs By Week * Game by game log of total team statistics. * Tags: Box Scores Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/TeamGameStatsBySeason/{season}/{teamid}/{numberofgames}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season
   , * @param teamid
   , * @param numberofgames

   */
  async getTeamGameLogsBySeason(season: number, teamid: number, numberofgames: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/TeamGameStatsBySeason/${season}/${teamid}/${numberofgames}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Team Game Stats * Tags: Box Scores Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/TeamGameStats/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week

   */
  async getTeamGameStats(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/TeamGameStats/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Team Week Stats * Tags: Box Scores Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/TeamSeasonStats/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season

   */
  async getTeamSeasonStats(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/TeamSeasonStats/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Timeframes * Get detailed information about past, present, and future timeframes. * Tags: Schedules & Game Day Info Feeds * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/Timeframes/{type}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   * @param type

   */
  async getTimeframes(type: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/Timeframes/${type}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Transactions By FunctionExtensions * Tags: Transactions Feeds * Recommended Call Interval: 1 Minute * Endpoint: * https://api.sportsdata.io//v3/nfl/scores/json/TransactionsByDate/{date}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 MINUTES
   * @param date

   */
  async getTransactionsByDate(date: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/TransactionsByDate/${date}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Metadata * Returns the list of MarketTypes, BetTypes, PeriodTypes, OutcomeTypes, and ResultTypes to map the IDs to descriptive names. Also includes a list of the MarketType, BetType & PeriodType combinations which we will have resulting for. * Tags: Active Books & Metadata Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingMetadata
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   !!removeMe
   */
  async getBettingMetadata(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingMetadata?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Events by FunctionExtensions * The list of current BettingEvents for the given date. Events in this include market information but no outcomes will be included here. Intended to allow both visibility to Events in order to match up Events -> Scores via the included ScoreID (where applicable) as well as provide a list of MarketIDs which are included in the given event. * Tags: Futures Feeds, Props Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingEventsByDate/{date}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param date

   */
  async getBettingEventsbyDate(date: Date): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingEventsByDate/${date}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Events by Week * Returns the full list of BetttingEvents for the given season. This does not take season-type (PRE/POST etc) into account. Intended for those who need to tie BettingEventIDs to ScoreIDs. * Tags: Futures Feeds, Props Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingEvents/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season

   */
  async getBettingEventsbySeason(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingEvents/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Futures by Week * Returns available Futures outcomes for the given season. Does not include line movement. * Tags: Futures Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingFuturesBySeason/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season

   */
  async getBettingFuturesbySeason(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingFuturesBySeason/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Market * Returns full line movement for a given BettingMarket. Is intended for historical data purposes and not for the most up to the second lines. * Tags: Futures Feeds, Props Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingMarket/{marketId}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param marketId

   */
  async getBettingMarket(marketId: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingMarket/${marketId}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Markets by Event * Returns the markets and available outcomes for a given BettingEventID. * Tags: Futures Feeds, Props Feeds * Recommended Call Interval: 10 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingMarkets/{eventId}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 10 MINUTES
   * @param eventId

   */
  async getBettingMarketsbyEvent(eventId: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingMarkets/${eventId}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Markets by GameID (formerly Betting Markets by ScoreID) * Returns the markets and available outcomes for a given ScoreID. Works the same as by BettingEventID but requires less ID mapping. * Tags: Futures Feeds, Props Feeds * Recommended Call Interval: 10 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingMarketsByScoreID/{scoreid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 10 MINUTES
   * @param scoreid

   */
  async getBettingMarketsbyGameIDformerlyBettingMarketsbyScoreID(scoreid: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingMarketsByScoreID/${scoreid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Markets by Market Type * Returns Markets and available outcomes for a given event and market type requested. A lighter call than by BettingEventID as it only includes markets tagged with the specific MarketType (1 - GameLines, 2 - Player Props, etc -- full list available in the BettingMetaData endpoint). * Tags: Futures Feeds, Props Feeds * Recommended Call Interval: 1 Minute * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingMarketsByMarketType/{eventId}/{marketTypeID}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 MINUTES
   * @param eventId
   , * @param marketTypeID

   */
  async getBettingMarketsbyMarketType(eventId: number, marketTypeID: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingMarketsByMarketType/${eventId}/${marketTypeID}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Player Props by GameID (formerly Betting Player Props by ScoreID) * Gets the available player props Markets & Outcomes for a given ScoreID. * Tags: Props Feeds * Recommended Call Interval: 10 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingPlayerPropsByScoreID/{scoreid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 10 MINUTES
   * @param scoreid

   */
  async getBettingPlayerPropsbyGameIDformerlyBettingPlayerPropsbyScoreID(scoreid: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingPlayerPropsByScoreID/${scoreid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Results By Market * Returns all outcomes under this market which have a result type associated. Will return empty list if resulting has not yet processed for the given game. Resulting processes shortly after game closing. * Tags: Aggregated Odds Resulting Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingMarketResults/{marketId}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param marketId

   */
  async getBettingResultsByMarket(marketId: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingMarketResults/${marketId}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Splits By BettingMarketId * List of Money and Bet Percentage splits for each outcome type available in this market. This specific endpoint will return the movement from this market as well as the most recent. * Tags: Betting Splits Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingSplitsByMarketId/{marketId}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param marketId

   */
  async getBettingSplitsByBettingMarketId(marketId: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingSplitsByMarketId/${marketId}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET DFS Slates by FunctionExtensions * Tags: Salaries & Slates Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/DfsSlatesByDate/{date}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param date

   */
  async getDFSSlatesbyDate(date: Date): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/DfsSlatesByDate/${date}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET DFS Slates by Week * Tags: Salaries & Slates Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/DfsSlatesByWeek/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season
   , * @param week

   */
  async getDFSSlatesbyWeek(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/DfsSlatesByWeek/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET DFS Slate Ownership Projections by SlateID * Slate Ownership Projections for a specific slate. Projections are for GPP format ownership. Will return an empty list if the slate is not yet projected or not a slate we have projections for. * Tags: Salaries & Slates Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/DfsSlateOwnershipProjectionsBySlateID/{slateId}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param slateId

   */
  async getDFSSlateOwnershipProjectionsbySlateID(slateId: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/DfsSlateOwnershipProjectionsBySlateID/${slateId}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Upcoming DFS Slate Ownership Projections * Grabs DFS Slates which have not yet started for which we have DFS Ownership projections. * Tags: Salaries & Slates Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/UpcomingDfsSlateOwnershipProjections
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   !!removeMe
   */
  async getUpcomingDFSSlateOwnershipProjections(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/UpcomingDfsSlateOwnershipProjections?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Projected Fantasy Defense Game Stats (w/ DFS Salaries) * Tags: Projections & Points Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/FantasyDefenseProjectionsByGame/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week

   */
  async getProjectedFantasyDefenseGameStatswDFSSalaries(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/FantasyDefenseProjectionsByGame/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Projected Fantasy Defense Week Stats (w/ ADP) * Tags: Projections & Points Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/FantasyDefenseProjectionsBySeason/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season

   */
  async getProjectedFantasyDefenseSeasonStatswADP(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/FantasyDefenseProjectionsBySeason/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Splits By GameID (formerly Betting Splits By ScoreID) * List of Money and Bet Percentage splits for each market and their respective outcome types available in this game. This specific endpoint will return current splits for each available market and no line movement. * Tags: Betting Splits Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/BettingSplitsByScoreId/{scoreId}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param scoreId

   */
  async getBettingSplitsByGameIDformerlyBettingSplitsByScoreID(scoreId: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/BettingSplitsByScoreId/${scoreId}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET In-Game Odds by Week * Provides in-play odds data for a given week. This means odds for games which are in-progress. Only serves the most recently seen data & does not include line movement. * Tags: In-Play Game Lines Feeds * Recommended Call Interval: 5 Seconds * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/LiveGameOddsByWeek/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 SECONDS
   * @param season
   , * @param week

   */
  async getInGameOddsbyWeek(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/LiveGameOddsByWeek/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET In-Game Odds Line Movement * Provides in-play odds line movement data for a given game. This means odds for games which are in-progress. Serves full line movement and is intended for showing the trend over a game rather than the most up-to-the second lines. * Tags: In-Play Game Lines Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/LiveGameOddsLineMovement/{scoreid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param scoreid

   */
  async getInGameOddsLineMovement(scoreid: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/LiveGameOddsLineMovement/${scoreid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Period Game Odds by Week * Returns the non-full-game odds for games in a given week & season. This means odds such as 1st-half or 1st-quarter, rather than full game. Only returns the most recently seen odds, not-including line movement. * Tags: Pre-Match Game Lines Feeds * Recommended Call Interval: 1 Minute * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/AlternateMarketGameOddsByWeek/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 MINUTES
   * @param season : number
   * @param week : number
   */
  async getPeriodGameOddsbyWeek(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/AlternateMarketGameOddsByWeek/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Period Game Odds Line Movement * Returns the non-full-game odds for games in a given ScoreID. This means odds such as 1st-half or 1st-quarter, rather than full game. Returns the full line movement for the given game. This endpoint has a longer cache as it is meant for historical data/line movement rather than the most up to the second line. * Tags: Pre-Match Game Lines Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/AlternateMarketGameOddsLineMovement/{scoreid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param scoreid

   */
  async getPeriodGameOddsLineMovement(scoreid: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/AlternateMarketGameOddsLineMovement/${scoreid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Pre-Game Odds by Week * Returns the full-game core odds for games in a given week & season. This means moneyline, spread, and total. Only returns the most recently seen odds, not-including line movement. * Tags: Pre-Match Game Lines Feeds * Recommended Call Interval: 30 Seconds * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/GameOddsByWeek/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 30 SECONDS
   * @param season
   , * @param week

   */
  async getPreGameOddsbyWeek(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/GameOddsByWeek/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Pre-Game Odds Line Movement * Returns the full-game core odds for a given ScoreID. This means moneyline, spread, and total. Only returns the most recently seen odds, not-including line movement. This endpoint has a longer cache as it is meant for historical data/line movement rather than the most up to the second line. * Tags: Pre-Match Game Lines Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/GameOddsLineMovement/{scoreid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param scoreid

   */
  async getPreGameOddsLineMovement(scoreid: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/GameOddsLineMovement/${scoreid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Trends by Matchup * Returns trends data for a given pairing of teams. Will return data even if the teams are not set to play this season. Intended for use on a specific game though it will work for other comparisons if applicable. * Tags: Matchups & Trends Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/MatchupTrends/{team}/{opponent}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param team
   , * @param opponent

   */
  async getBettingTrendsbyMatchup(team: string, opponent: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/MatchupTrends/${team}/${opponent}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Premium News * Tags: Player News & Notes Feeds * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/news-rotoballer/json/RotoBallerPremiumNews
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   !!removeMe
   */
  async getPremiumNews(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/news-rotoballer/json/RotoBallerPremiumNews?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Premium News by FunctionExtensions * Tags: Player News & Notes Feeds * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/news-rotoballer/json/RotoBallerPremiumNewsByDate/{date}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   * @param date

   */
  async getPremiumNewsbyDate(date: Date): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/news-rotoballer/json/RotoBallerPremiumNewsByDate/${date}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Premium News by Player * Tags: Player News & Notes Feeds * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/news-rotoballer/json/RotoBallerPremiumNewsByPlayerID/{playerid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   * @param playerid

   */
  async getPremiumNewsbyPlayer(playerid: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/news-rotoballer/json/RotoBallerPremiumNewsByPlayerID/${playerid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Premium News by Team * Tags: Player News & Notes Feeds * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/news-rotoballer/json/RotoBallerPremiumNewsByTeam/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   * @param team

   */
  async getPremiumNewsbyTeam(team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/news-rotoballer/json/RotoBallerPremiumNewsByTeam/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Injured Players * This endpoint provides all currently injured NFL players, along with injury details. * Tags: Injuries Feeds * Recommended Call Interval: 1 Minute * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/InjuredPlayers
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 MINUTES
   !!removeMe
   */
  async getInjuredPlayers(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/InjuredPlayers?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET IDP Projected Player Game Stats by Team (w/ Injuries, Lineups, DFS Salaries) * Tags: Projections & Points Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/IdpPlayerGameProjectionStatsByTeam/{season}/{week}/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week
   , * @param team

   */
  async getIDPProjectedPlayerGameStatsbyTeamwInjuriesLineupsDFSSalaries(season: number, week: number, team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/IdpPlayerGameProjectionStatsByTeam/${season}/${week}/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET IDP Projected Player Game Stats by Week (w/ Injuries, Lineups, DFS Salaries) * Tags: Projections & Points Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/IdpPlayerGameProjectionStatsByWeek/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week

   */
  async getIDPProjectedPlayerGameStatsbyWeekwInjuriesLineupsDFSSalaries(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/IdpPlayerGameProjectionStatsByWeek/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Projected Player Game Stats by Team (w/ Injuries, Lineups, DFS Salaries) * Tags: Projections & Points Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/PlayerGameProjectionStatsByTeam/{season}/{week}/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week
   , * @param team

   */
  async getProjectedPlayerGameStatsbyTeamwInjuriesLineupsDFSSalaries(season: number, week: number, team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/PlayerGameProjectionStatsByTeam/${season}/${week}/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Projected Player Game Stats by Week (w/ Injuries, Lineups, DFS Salaries) * Tags: Projections & Points Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/PlayerGameProjectionStatsByWeek/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week

   */
  async getProjectedPlayerGameStatsbyWeekwInjuriesLineupsDFSSalaries(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/PlayerGameProjectionStatsByWeek/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Projected Player Week Stats (w/ ADP) * Tags: Projections & Points Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/PlayerSeasonProjectionStats/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season

   */
  async getProjectedPlayerSeasonStatswADP(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/PlayerSeasonProjectionStats/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Projected Player Week Stats by Team (w/ ADP) * Tags: Projections & Points Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/projections/json/PlayerSeasonProjectionStatsByTeam/{season}/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param team

   */
  async getProjectedPlayerSeasonStatsbyTeamwADP(season: number, team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/projections/json/PlayerSeasonProjectionStatsByTeam/${season}/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Sportsbooks (Active) * Returns a list for mapping SportsbookID to the Sportsbook name. * Tags: Active Books & Metadata Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/ActiveSportsbooks
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   !!removeMe
   */
  async getSportsbooksActive(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/ActiveSportsbooks?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Betting Trends by Team * Describes recent team trends and performance against betting data in recent sets of games * Tags: Matchups & Trends Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/odds/json/TeamTrends/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param team

   */
  async getBettingTrendsbyTeam(team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/TeamTrends/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Box Score * Tags: Box Scores Feeds * Recommended Call Interval: 1 Minute * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/BoxScoreByScoreID/v3/{scoreid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 MINUTES
   * @param scoreid

   */
  async getBoxScore(scoreid: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/BoxScoreByScoreID/v3/${scoreid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Box Score by Team * Tags: Box Scores Feeds * Recommended Call Interval: 1 Minute * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/BoxScore/v3/{season}/{week}/{hometeam}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 MINUTES
   * @param season
   , * @param week
   , * @param hometeam

   */
  async getBoxScorebyTeam(season: number, week: number, hometeam: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/BoxScore/v3/${season}/${week}/${hometeam}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }

  async getBoxScoresFinalByWeek(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/BoxScoresFinal/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data.map(d => {
        d.HomeTeam = nflTeams.find(f => f.Abbreviation === d.HomeTeam)
        d.AwayTeam = nflTeams.find(f => f.Abbreviation === d.AwayTeam)
        return d
      })
    }));
  }


  /**
   * GET Box Scores by Week Delta * This method returns all box scores for a given season and week, but only returns player stats that have changed in the last X minutes. You can also filter by type of player stats to include, such as traditional fantasy players, IDP players or all players. * Tags: Box Scores Feeds * Recommended Call Interval: 3 Seconds * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/BoxScoresDelta/v3/{season}/{week}/{playerstoinclude}/{minutes}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 SECONDS
   * @param season
   , * @param week
   , * @param playerstoinclude
   , * @param minutes

   */
  async getBoxScoresbyWeekDelta(season: number, week: number, playerstoinclude: any, minutes: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/BoxScoresDelta/v3/${season}/${week}/${playerstoinclude}/${minutes}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Fantasy Defense Game Stats * Tags: Fantasy Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/FantasyDefenseByGame/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week

   */
  async getFantasyDefenseGameStats(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/FantasyDefenseByGame/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Fantasy Defense Game Stats by Team * Tags: Fantasy Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/FantasyDefenseByGameByTeam/{season}/{week}/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week
   , * @param team

   */
  async getFantasyDefenseGameStatsbyTeam(season: number, week: number, team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/FantasyDefenseByGameByTeam/${season}/${week}/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Fantasy Defense Week Stats * Tags: Fantasy Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/FantasyDefenseBySeason/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season

   */
  async getFantasyDefenseSeasonStats(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/FantasyDefenseBySeason/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Fantasy Defense Week Stats by Team * Tags: Fantasy Info Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/FantasyDefenseBySeasonByTeam/{season}/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param team

   */
  async getFantasyDefenseSeasonStatsbyTeam(season: number, team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/FantasyDefenseBySeasonByTeam/${season}/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Injuries * Tags: Injuries Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/Injuries/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week

   */
  async getInjuries(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/Injuries/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Injuries by Team * Tags: Injuries Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/Injuries/{season}/{week}/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week
   , * @param team

   */
  async getInjuriesbyTeam(season: number, week: number, team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/Injuries/${season}/${week}/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Game Logs By Week * Tags: Box Scores Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerGameStatsBySeason/{season}/{playerid}/{numberofgames}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season
   , * @param playerid
   , * @param numberofgames

   * @param playerid
   * @param numberofgames
   */
  async getPlayerGameLogsBySeason(season: number, playerid: number, numberofgames: any): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerGameStatsBySeason/${season}/${playerid}/${numberofgames}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data.map(d => {
        d.Opponent = nflTeams.find(f => f.Abbreviation === d.Opponent)
        return d

      })

    }));
  }


  /**
   * GET Player Game Stats by Team * Tags: Box Scores Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerGameStatsByTeam/{season}/{week}/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week
   , * @param team

   */
  async getPlayerGameStatsbyTeam(season: number, week: number, team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerGameStatsByTeam/${season}/${week}/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Game Stats by Week * Tags: Box Scores Feeds * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerGameStatsByWeek/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season
   , * @param week

   */
  async getPlayerGameStatsbyWeek(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerGameStatsByWeek/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Game Stats by Week Delta * Tags: Box Scores Feeds * Recommended Call Interval: 5 Seconds * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerGameStatsByWeekDelta/{season}/{week}/{minutes}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 SECONDS
   * @param season
   , * @param week
   , * @param minutes

   */
  async getPlayerGameStatsbyWeekDelta(season: number, week: number, minutes: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerGameStatsByWeekDelta/${season}/${week}/${minutes}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Game Stats Delta * Tags: Box Scores Feeds * Recommended Call Interval: 5 Seconds * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerGameStatsDelta/{minutes}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 SECONDS
   * @param minutes

   */
  async getPlayerGameStatsDelta(minutes: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerGameStatsDelta/${minutes}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Game Red Zone Stats * Tags: Split Stats Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerGameRedZoneStats/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season
   , * @param week

   */
  async getPlayerGameRedZoneStats(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerGameRedZoneStats/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Game Red Zone Stats Inside Five * Tags: Split Stats Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerGameRedZoneInsideFiveStats/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season
   , * @param week

   */
  async getPlayerGameRedZoneStatsInsideFive(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerGameRedZoneInsideFiveStats/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Game Red Zone Stats Inside Ten * Tags: Split Stats Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerGameRedZoneInsideTenStats/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season
   , * @param week

   */
  async getPlayerGameRedZoneStatsInsideTen(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerGameRedZoneInsideTenStats/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Pro Bowlers * Tags: Rosters & Profiles Feeds * Recommended Call Interval: 4 Hours * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/ProBowlers/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 4 HOURS
   * @param season

   */
  async getProBowlers(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/ProBowlers/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Fantasy Player Ownership Percentages (Week-Long) * Tags: Projections & Points Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerOwnership/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season
   , * @param week

   */
  async getFantasyPlayerOwnershipPercentagesSeasonLong(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerOwnership/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Week Stats * Tags: Box Scores Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerSeasonStats/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season

   */
  async getPlayerSeasonStats(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerSeasonStats/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Week Stats by Team * Tags: Box Scores Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerSeasonStatsByTeam/{season}/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season
   , * @param team

   */
  async getPlayerSeasonStatsbyTeam(season: number, team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerSeasonStatsByTeam/${season}/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Week Red Zone Stats * Tags: Split Stats Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerSeasonRedZoneStats/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season

   */
  async getPlayerSeasonRedZoneStats(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerSeasonRedZoneStats/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Week Red Zone Stats Inside Five * Tags: Split Stats Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerSeasonRedZoneInsideFiveStats/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season

   */
  async getPlayerSeasonRedZoneStatsInsideFive(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerSeasonRedZoneInsideFiveStats/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Week Red Zone Stats Inside Ten * Tags: Split Stats Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerSeasonRedZoneInsideTenStats/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season

   */
  async getPlayerSeasonRedZoneStatsInsideTen(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerSeasonRedZoneInsideTenStats/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Week Third Down Stats * Tags: Split Stats Feeds * Recommended Call Interval: 15 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/stats/json/PlayerSeasonThirdDownStats/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 15 MINUTES
   * @param season

   */
  async getPlayerSeasonThirdDownStats(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/PlayerSeasonThirdDownStats/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Play By Play * Tags: Play by Play Feeds * Recommended Call Interval: 1 Minute * Endpoint: * https://api.sportsdata.io//v3/nfl/pbp/json/PlayByPlay/{gameid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 MINUTES
   * @param gameid

   */
  async getPlayByPlay(gameid: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/pbp/json/PlayByPlay/${gameid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Play By Play By Team * Tags: Play by Play Feeds * Recommended Call Interval: 1 Minute * Endpoint: * https://api.sportsdata.io//v3/nfl/pbp/json/PlayByPlay/{season}/{week}/{hometeam}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 MINUTES
   * @param season
   , * @param week
   , * @param hometeam

   */
  async getPlayByPlayByTeam(season: number, week: number, hometeam: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/pbp/json/PlayByPlay/${season}/${week}/${hometeam}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Play By Play Delta * Tags: Play by Play Feeds * Recommended Call Interval: 3 Seconds * Endpoint: * https://api.sportsdata.io//v3/nfl/pbp/json/PlayByPlayDelta/{season}/{week}/{minutes}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 SECONDS
   * @param season
   , * @param week
   , * @param minutes

   */
  async getPlayByPlayDelta(season: number, week: number, minutes: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/pbp/json/PlayByPlayDelta/${season}/${week}/${minutes}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET BAKER Betting Trends by Player * Recommended Call Interval: 10 Minutes * Endpoint: * https://baker-api.sportsdata.io/baker/v2/nfl/trends/{date}/players/{playerid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 10 MINUTES
   * @param date
   , * @param playerid

   */
  async getBAKERBettingTrendsbyPlayer(date: Date, playerid: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}baker/v2/nfl/trends/${date}/players/${playerid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Advanced Player Game Stats * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/advanced-metrics/json/AdvancedPlayerGameStats/{season}/{week}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season
   , * @param week

   */
  async getAdvancedPlayerGameStats(season: number, week: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/advanced-metrics/json/AdvancedPlayerGameStats/${season}/${week}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Advanced Player Game Stats by Player * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/advanced-metrics/json/AdvancedPlayerGameStatsByPlayerID/{season}/{playerid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season
   , * @param playerid

   */
  async getAdvancedPlayerGameStatsbyPlayer(season: number, playerid: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/advanced-metrics/json/AdvancedPlayerGameStatsByPlayerID/${season}/${playerid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Advanced Player Week Stats by Player * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/advanced-metrics/json/AdvancedPlayerSeasonStatsByPlayerID/{season}/{playerid}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season
   , * @param playerid

   */
  async getAdvancedPlayerSeasonStatsbyPlayer(season: number, playerid: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/advanced-metrics/json/AdvancedPlayerSeasonStatsByPlayerID/${season}/${playerid}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Advanced Player Week Stats by Team * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/advanced-metrics/json/AdvancedPlayerSeasonStats/{season}/{team}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   * @param season
   , * @param team

   */
  async getAdvancedPlayerSeasonStatsbyTeam(season: number, team: string): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/advanced-metrics/json/AdvancedPlayerSeasonStats/${season}/${team}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Headshots * Tags: Player Headshots Feeds * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io//v3/nfl/headshots/json/Headshots
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   !!removeMe
   */
  async getHeadshots(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/headshots/json/Headshots?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Details by Available * Player Details by Available * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io/api/nfl/fantasy/json/Players
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   !!removeMe
   */
  async getPlayerDetailsbyAvailable(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}api/nfl/fantasy/json/Players?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Player Details by Free Agents * Player Details by Free Agents * Recommended Call Interval: 1 Hour * Endpoint: * https://api.sportsdata.io/api/nfl/fantasy/json/FreeAgents
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 1 HOURS
   !!removeMe
   */
  async getPlayerDetailsbyFreeAgents(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}api/nfl/fantasy/json/FreeAgents?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Advanced Players * Recommended Call Interval: 4 Hours * Endpoint: * https://api.sportsdata.io//v3/nfl/advanced-metrics/json/AdvancedPlayers
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 4 HOURS
   !!removeMe
   */
  async getAdvancedPlayers(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/advanced-metrics/json/AdvancedPlayers?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Rotoworld Player News (Recent) * Tags: Player News & Notes Feeds * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/rotoworld/json/RotoworldPlayerNews
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   !!removeMe
   */
  async getRotoworldPlayerNewsRecent(): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/rotoworld/json/RotoworldPlayerNews?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Rotoworld Player News by FunctionExtensions * Tags: Player News & Notes Feeds * Recommended Call Interval: 3 Minutes * Endpoint: * https://api.sportsdata.io//v3/nfl/rotoworld/json/RotoworldPlayerNewsByDate/{date}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 3 MINUTES
   * @param date

   */
  async getRotoworldPlayerNewsbyDate(date: Date): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/rotoworld/json/RotoworldPlayerNewsByDate/${date}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }


  /**
   * GET Scores by Week * Game scores for a specified season. * Recommended Call Interval: 5 Minutes * Endpoint: * https://api.sportsdata.io/api/nfl/odds/json/Scores/{season}
   * Tags: Schedules & Game Day Info Feeds
   * Recommended Call Interval: 5 MINUTES
   * @param season

   */
  async getScoresbySeason(season: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/odds/json/ScoresFinal/${season}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }

  /**
   * A slimmed-down score endpoint, giving just the quarter scores and final score, for simple applications.
   * Recommended Call Interval: 1 MINUTES
   * @param season
   * @param week
   */
  async getScoresBySeasonFinal(season: number = 2023) {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/stats/json/ScoresFinal/${season}?key=${this.apiKey}`, {}).pipe(
        map((data: any[]) => {
          return data.map(d => {
            d.HomeTeam = nflTeams.find(f  => f.Abbreviation === d.HomeTeam)
            d.AwayTeam = nflTeams.find(f => f.Abbreviation === d.AwayTeam)
            return d

          })
        }));
  }

  async getPlayerNewsById(playerId: number): Promise<Observable<any[]>> {
    return this.httpClient.get<any[]>(`${this.endpoint}/v3/nfl/scores/json/NewsByPlayerID/${playerId}?key=${this.apiKey}`, {}).pipe(map((data: any[]) => {
      return data;
    }));
  }
}


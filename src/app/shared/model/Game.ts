class GameDetail {
  game_key: string;
  season_type: number;
  season: number;
  week: number;
  date: string;
  away_team: string;
  home_team: string;
  channel: string;
  point_spread: number;
  over_under: number;
  stadium_i_d: number;
  canceled: boolean;
  forecast_temp_low: number;
  forecast_temp_high: number;
  forecast_description: string;
  forecast_wind_chill: number;
  forecast_wind_speed: number;
  away_team_money_line: number;
  home_team_money_line: number;
  day: string;
  date_time: string;
  global_game_i_d: number;
  global_away_team_i_d: number;
  global_home_team_i_d: number;
  score_i_d: number;
  status: string;
  date_time_u_t_c: string;
  stadium_details: StadiumDetail;


  constructor(game_key: string, season_type: number, season: number, week: number, date: string, away_team: string, home_team: string, channel: string, point_spread: number, over_under: number, stadium_i_d: number, canceled: boolean, forecast_temp_low: number, forecast_temp_high: number, forecast_description: string, forecast_wind_chill: number, forecast_wind_speed: number, away_team_money_line: number, home_team_money_line: number, day: string, date_time: string, global_game_i_d: number, global_away_team_i_d: number, global_home_team_i_d: number, score_i_d: number, status: string, date_time_u_t_c: string, stadium_details: StadiumDetail) {
    this.game_key = game_key;
    this.season_type = season_type;
    this.season = season;
    this.week = week;
    this.date = date;
    this.away_team = away_team;
    this.home_team = home_team;
    this.channel = channel;
    this.point_spread = point_spread;
    this.over_under = over_under;
    this.stadium_i_d = stadium_i_d;
    this.canceled = canceled;
    this.forecast_temp_low = forecast_temp_low;
    this.forecast_temp_high = forecast_temp_high;
    this.forecast_description = forecast_description;
    this.forecast_wind_chill = forecast_wind_chill;
    this.forecast_wind_speed = forecast_wind_speed;
    this.away_team_money_line = away_team_money_line;
    this.home_team_money_line = home_team_money_line;
    this.day = day;
    this.date_time = date_time;
    this.global_game_i_d = global_game_i_d;
    this.global_away_team_i_d = global_away_team_i_d;
    this.global_home_team_i_d = global_home_team_i_d;
    this.score_i_d = score_i_d;
    this.status = status;
    this.date_time_u_t_c = date_time_u_t_c;
    this.stadium_details = stadium_details;
  }
}

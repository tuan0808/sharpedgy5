class StadiumDetail {
  stadium_i_d: number;
  name: string;
  city: string;
  country: string;
  capacity: number;
  playing_surface: string;
  geo_lat: number;
  geo_long: number;
  type: string;


  constructor(stadium_i_d: number, name: string, city: string, country: string, capacity: number, playing_surface: string, geo_lat: number, geo_long: number, type: string) {
    this.stadium_i_d = stadium_i_d;
    this.name = name;
    this.city = city;
    this.country = country;
    this.capacity = capacity;
    this.playing_surface = playing_surface;
    this.geo_lat = geo_lat;
    this.geo_long = geo_long;
    this.type = type;
  }
}

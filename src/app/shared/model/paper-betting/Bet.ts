import {SportType} from "../SportType";
import {BetFormData} from "./BetFormData";

export interface Bet extends BetFormData {
    userId : string,
    homeTeam : string,
    awayTeam : string,
    sport : SportType,
}

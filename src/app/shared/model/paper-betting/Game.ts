import {GameDetails} from "./GameDetails";
import {Team} from "./Team";
import {Betting} from "./Betting";
import {BetSettlement} from "./BetSettlement";

export interface Game extends Betting {
    gameId : number
    status : string
    scheduled : string
    venue : string
    homeTeam: Team
    awayTeam: Team
    favorite : string
    betSettlement : BetSettlement
}



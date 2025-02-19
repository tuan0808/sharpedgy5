import {BetFormComponent} from "../../../components/paper-betting/bet-form/bet-form.component";
import {BetFormData} from "./BetFormData";
import {SportType} from "../SportType";
import {BetTypes} from "../enums/BetTypes";
import {BetSettlement} from "./BetSettlement";

export class BetHistory implements BetSettlement {
    gameId : string
    userId : string
    homeTeam : string
    awayTeam: string
    gameStart : Date
    // Representing enums as strings here; adjust as needed.
    sport: SportType
    betType: BetTypes;
    wagerValue: number;
    wagerAmount: number;

}

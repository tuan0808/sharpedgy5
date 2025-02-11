import {BetFormComponent} from "../../../components/paper-betting/bet-form/bet-form.component";
import {BetFormData} from "./BetFormData";
import {SportType} from "../SportType";
import {BetTypes} from "../enums/BetTypes";

export class BetHistory implements BetFormData {
    id : number
    userId : string
    homeTeam : string
    awayTeam: string
    datetime : Date
    // Representing enums as strings here; adjust as needed.
    sport: SportType
    amount: number;
    betType: BetTypes;
    betValue: number;

}

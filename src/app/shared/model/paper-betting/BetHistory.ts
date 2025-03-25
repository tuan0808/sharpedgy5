import {SportType} from "../SportType";
import {BetTypes} from "../enums/BetTypes";
import {BetSettlement} from "./BetSettlement";
import {Status} from "../enums/Status";

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
    amount : number = 0 ;
    status : Status = Status.PENDING
    selectedTeam: string;
    potentialWinnings: number
    controlNote : string = ''
    comment: string = '';
}

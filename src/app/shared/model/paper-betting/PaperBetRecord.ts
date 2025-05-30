import {BetSettlement} from "./BetSettlement";
import {SportType} from "../SportType";
import {Status} from "../enums/Status";

export class PaperBetRecord extends BetSettlement {
    gameId : string
    gameStart : Date
    sport: SportType = SportType.NFL
    amount : number = 0 ;
    status : Status = Status.PENDING
    selectedTeam: string;
    potentialWinnings: number
}

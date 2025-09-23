import {BetSettlement} from "./BetSettlement";
import {SportType} from "../SportType";
import {EventStatus} from "../enums/EventStatus";
import {BetTypes} from "../enums/BetTypes";

export class PaperBetRecord extends BetSettlement {
    gameId : number
    userId : string
    sport: SportType = SportType.NFL
    amount : number = 0 ;
    betStatus : EventStatus = EventStatus.PENDING
    selectedTeam: string;
    gameStart : Date;
    potentialWinnings: number
    tempId: string;
}

import {BetTypes} from "./enums/BetTypes";
import {SportType} from "./SportType";
import {Status} from "./enums/Status";

export class Prediction {
    gameId : string
    betType : BetTypes
    selectedTeam : string
    confidence : number
    note : string
    sport : SportType
    gameStart : Date
    status : Status
    wagerValue : number
    creationDate: Date;

}

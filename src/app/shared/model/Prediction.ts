import {BetTypes} from "./enums/BetTypes";
import {SportType} from "./SportType";
import {EventStatus} from "./enums/EventStatus";

export class Prediction {
    gameId : number
    betType : BetTypes
    selectedTeam : string
    confidence : number
    note : string
    sport : SportType
    gameStart : Date
    status : EventStatus
    wagerValue : number
    creationDate: Date;

}

import {BetTypes} from "./enums/BetTypes";
import {SportType} from "./SportType";
import {EventStatus} from "./enums/EventStatus";

export class Prediction {
    message : string
    gameId : number
    userId : string
    betStatus : EventStatus
    creationDate: Date;
    sport : SportType
    betType : BetTypes
    selectedTeam : string
    gameStart : Date
    wagerValue : number

}

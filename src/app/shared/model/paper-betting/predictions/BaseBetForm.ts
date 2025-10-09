import {BetTypes} from "../../enums/BetTypes";
import {EventStatus} from "../../enums/EventStatus";

export class BaseBetForm {
    betType: BetTypes
    selectedTeam: string
    wagerValue: number
    status : EventStatus
    message : String = ''
}

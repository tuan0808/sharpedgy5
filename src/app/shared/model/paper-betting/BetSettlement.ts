import {BetTypes} from "../enums/BetTypes";
import {EventStatus} from "../enums/EventStatus";

export  class BetSettlement {
    betType: BetTypes
    selectedTeam: string
    wagerValue: number
    wagerAmount: number
    status : EventStatus
    message : string = ''
}

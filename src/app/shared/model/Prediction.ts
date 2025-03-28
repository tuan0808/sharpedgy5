import {BetTypes} from "./enums/BetTypes";

export class Prediction {
    gameId : string
    betType : BetTypes
    selectTeam : string
    confidenceLevel : number
    note : string
}

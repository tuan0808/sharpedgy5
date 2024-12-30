import {Injectable} from '@angular/core';
import {PlayersComponent} from "../../nfl/players/players.component";
import {ScoresComponent} from "../../nfl/scores/scores.component";
import {StandingComponent} from "../../nfl/standing/standing.component";
import {TeamsComponent} from "../../nfl/teams/teams.component";

@Injectable({
    providedIn: 'root'
})
export class ComponentRegistryService {
    private registerDirectories: String[] = [""]
    private registryMap: Map<String, any> = new Map<String, any>()

    constructor() {
        this.registryMap.set("playerInfo", PlayersComponent)
        this.registryMap.set("scores", ScoresComponent)
        this.registryMap.set("standing", StandingComponent)
        this.registryMap.set("teams", TeamsComponent)

    }

    getComponent(name: string) {
        return this.registryMap.get(name);
    }


    private async registerDashboardComponets() {

    }
}

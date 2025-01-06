import {Injectable} from '@angular/core';
import {PlayersComponent} from "../../nfl/players/players.component";
import {ScoresComponent} from "../../nfl/scores/scores.component";
import {StandingComponent} from "../../nfl/standing/standing.component";
import {TeamsComponent} from "../../nfl/teams/teams.component";
import {HttpClient} from "@angular/common/http";
import {DashboardItem} from "../data/dashboard/DashboardItem";
import {catchError, map} from "rxjs/operators";
import {throwError} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ComponentRegistryService {
    private registerDirectories: String[] = [""]
    private registryMap: Map<String, any> = new Map<String, any>()
    private endpoint = "http://localhost:8080"
    constructor(private httpClient: HttpClient) {
        this.registryMap.set("playerInfo", PlayersComponent)
        this.registryMap.set("scores", ScoresComponent)
        this.registryMap.set("standing", StandingComponent)
        this.registryMap.set("teams", TeamsComponent)

    }

    getComponent(name: string) {
        return this.registryMap.get(name);
    }

    async save(uuid: any, item: DashboardItem[]) {
        console.log(JSON.stringify(item))
        console.log(`${this.endpoint}/dashboard/v1/${uuid}/saveDashboard`)
        return this.httpClient.post<any[]>(`${this.endpoint}/dashboard/v1/${uuid}/saveDashboard`, item)
            .pipe(
                catchError(error => {
                    // Handle the error here
                    console.error('Error:', error);

                    // Optionally, return a new observable to continue the stream
                    // or throw the error to propagate it further
                    return throwError('Something went wrong!');
                })
            );
    }


    private async registerDashboardComponets() {

    }
}

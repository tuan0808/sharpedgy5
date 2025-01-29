import {Injectable} from '@angular/core';
import {PlayersComponent} from "../../nfl/players/players.component";
import {ScoresComponent} from "../../nfl/scores/scores.component";
import {StandingComponent} from "../../nfl/standing/standing.component";
import {TeamsComponent} from "../../nfl/teams/teams.component";
import {HttpClient} from "@angular/common/http";
import {DashboardItem} from "../data/dashboard/DashboardItem";
import {catchError, map, tap} from "rxjs/operators";
import {Observable, shareReplay, throwError} from "rxjs";
import {Dashboard} from "../data/dashboard/Dashboard";

@Injectable({
    providedIn: 'root'
})
export class  ComponentRegistryService {
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
    
    async getDefaultDashboard(uuid: any): Promise<Observable<Dashboard>> {
        return this.httpClient.get<Dashboard>(`${this.endpoint}/dashboard/v1/${uuid}/getDefaultDashboard`)
            .pipe(
                map(m => m)
            )
    }

    updateComponents(dashboardId: number, components: any[]) {
        const url = `${this.endpoint}/dashboard/v1/${dashboardId}/updateComponents`;
        console.log('Sending update request to:', url);
        console.log('Components data:', JSON.stringify(components, null, 2));

        return this.httpClient.put<void>(url, components).pipe(
            tap(() => console.log('Update request completed successfully')),
            catchError(error => {
                console.error('Error updating components:', error);
                return throwError(() => error);
            }),
            shareReplay(1)
        );
    }

    async save(uuid: any, dashboardId: number, item: DashboardItem[]) {
        console.log(JSON.stringify(item))
        console.log(`${this.endpoint}/dashboard/v1/${uuid}/${dashboardId}/saveDashboard`)
        return this.httpClient.post<any[]>(`${this.endpoint}/dashboard/v1/${uuid}/${dashboardId}/saveDashboard`, item)
            .pipe(
                map(m => true),
                catchError(error => {
                    // Handle the error here

                    console.error('Error:', error);

                    // Optionally, return a new observable to continue the stream
                    // or throw the error to propagate it further
                    return throwError('Something went wrong!');
                })
            );
    }

    async loadComponents(dashboardId: number): Promise<Observable<DashboardItem[]>> {
        const response = await this.httpClient.get<DashboardItem[]>(`${this.endpoint}/dashboard/v1/${dashboardId}/loadDashboard`);
        console.log(response)
        return response;
    }

    async getDashboards(uuid: any): Promise<Observable<Dashboard[]>> {
        return this.httpClient.get<Dashboard[]>(`${this.endpoint}/dashboard/v1/${uuid}/getDashboards`);
    }
}

 import { Component } from '@angular/core';
 import {NflDataService} from "../../../shared/services/nfl-data.service";
 import {Observable} from "rxjs";
 import {AsyncPipe, NgForOf, NgOptimizedImage, NgStyle} from "@angular/common";

@Component({
    selector: 'app-teams',
    imports: [
        NgForOf,
        AsyncPipe,
        NgOptimizedImage,
        NgStyle
    ],
    templateUrl: './teams.component.html',
    styleUrl: './teams.component.scss'
})
export class TeamsComponent {
  protected teams: Observable<any[]>;
  constructor(private nflService : NflDataService) {
    nflService.getTeams().then(t=>{
        t.subscribe(s=>console.log(s))
        this.teams = t
    })
  }
}

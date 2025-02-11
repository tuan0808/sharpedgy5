import { Component } from '@angular/core';
import {Observable} from "rxjs";
import {AsyncPipe, NgForOf} from "@angular/common";
import {TeamcardComponent} from "./teamcard/teamcard.component";
import {NflDataService} from "../../../shared/services/nfl-data.service";

@Component({
  selector: 'app-scores',
  standalone: true,
  imports: [
    TeamcardComponent,
    AsyncPipe,
    NgForOf
  ],
  templateUrl: './scores.component.html',
  styleUrl: './scores.component.scss'
})
export class ScoresComponent {
  protected gameScores: Observable<any[]>  | undefined;

  constructor(private nflDataService : NflDataService) {
    nflDataService.getScoresBySeasonFinal(2024)
        .then(gs=>{
          this.gameScores = gs
          gs.subscribe(s=>console.log(s))
        })
  }
}

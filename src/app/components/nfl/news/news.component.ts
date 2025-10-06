import { Component } from '@angular/core';
import {AsyncPipe, NgForOf} from "@angular/common";
import {Observable} from "rxjs";
import {NflDataService} from "../../../shared/services/nfl-data.service";

@Component({
    selector: 'app-news',
    imports: [
        AsyncPipe,
        NgForOf
    ],
    templateUrl: './news.component.html',
    styleUrl: './news.component.scss'
})
export class NewsComponent {
  protected news : Observable<any[]>
    constructor(private nflService : NflDataService) {
        nflService.getNews().then(t=>this.news = t)
    }
}

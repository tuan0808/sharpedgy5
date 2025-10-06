import { Component } from '@angular/core';
import {AgGridAngular} from "ag-grid-angular";
import {DragScrollComponent, DragScrollItemDirective} from "ngx-drag-scroll";
import {AsyncPipe, NgForOf} from "@angular/common";
import {ColDef} from "ag-grid-community";
import {Observable} from "rxjs";
import schedule from '../../../../assets/data/schedule.json'
import {NflDataService} from "../../../shared/services/nfl-data.service";

@Component({
    selector: 'app-injuries',
    imports: [
        AgGridAngular,
        DragScrollComponent,
        DragScrollItemDirective,
        NgForOf,
        AsyncPipe
    ],
    templateUrl: './injuries.component.html',
    styleUrl: './injuries.component.scss'
})
export class InjuriesComponent {

  currentDate : Date = new Date()
  weeks : number[] = []
  injuries : Observable<any[]>
  protected readonly schedule = schedule;
  constructor(private nflService : NflDataService) {
    nflService.getWeekCurrent().then(t  =>
    t.subscribe(s=>{

      nflService.getInjuries(this.currentDate.getFullYear(), s).then(th=>
          this.injuries = th)
    }))
    console.log(this.weeks)

  }

}

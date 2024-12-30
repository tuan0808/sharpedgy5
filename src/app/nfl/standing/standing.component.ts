import {Component, ViewChild} from '@angular/core';
import {NgbCalendar, NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {DragScrollComponent, DragScrollItemDirective} from "ngx-drag-scroll";
import {NflDataService} from "../../shared/services/nfl-data.service";
import {AgGridAngular} from "ag-grid-angular";
import {AsyncPipe, NgClass, NgForOf} from "@angular/common";
import {Observable} from "rxjs";
import {MdbTooltipModule} from "mdb-angular-ui-kit/tooltip";
import {map} from "rxjs/operators";

@Component({
  selector: 'app-standing',
  standalone: true,
  imports: [
    AgGridAngular,
    DragScrollComponent,
    NgForOf,
    NgClass,
    DragScrollItemDirective,
    AsyncPipe,
    MdbTooltipModule
  ],
  templateUrl: './standing.component.html',
  styleUrl: './standing.component.scss'
})
export class StandingComponent {
  @ViewChild('nav', {read: DragScrollComponent}) ds: DragScrollComponent | undefined;


  //protected standingsList: NFLStanding[] = [];
  protected standingsList : Observable<any[]> = new Observable<any[]>()

  protected model: NgbDateStruct | undefined;
  protected yearArray : number[] = []
  protected currentYear  = new Date().getFullYear();
  private YEARS_TO_GO_BACK = 20;
  protected currentPage : number = 0
  protected itemsPerPage : number = 10


  constructor(private httpService: NflDataService, private calendar: NgbCalendar) {
    this.populateDateArray()
    this.getStandingByYear(new Date().getFullYear())
  }

  populateDateArray() {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < this.YEARS_TO_GO_BACK; i++) {
      this.yearArray.push(currentYear - i);
    }
    setTimeout(() => {
      // @ts-ignore
      this.ds.moveTo(this.yearArray.length);
    }, 0);
  }

  getStandingByYear(year : number) {
    this.httpService.getStandings(year).then(t=>{
      this.standingsList = t
    })
   /* this.httpService.getStandings(year)
        .then(t =>
            t.subscribe(s => {
              // @ts-ignore
              this.standingsList = s.map(m =>
                  // @ts-ignore

                  //let res = nflTeams.find(f => f.Abbreviation.toLowerCase() === m.name.toLowerCase()).FullName
                  // console.log(res)
                  new NFLStanding(
                      m.Name,
                      m.Wins,
                      m.Losses,
                      m.Ties,
                      m.Percentage,
                      `${m.HomeWins} - ${m.HomeTies} - ${m.HomeLosses}`,
                      `${m.AwayWins} - ${m.AwayTies} - ${m.AwayLosses}`,
                      `${m.DivisionWins} - ${m.DivisionTies} - ${m.DivisionLosses}`,
                      `${m.ConferenceWins} - ${m.ConferenceTies} - ${m.ConferenceLosses}`,
                      m.PointsFor,
                      m.PointsAgainst,
                      m.NetPoints,
                      m.Streak
                  )
              );
              console.log(this.standingsList)
            })
        )*/
  }

  selectYear(year: number) {
    this.model = { year: year, month: 1, day: 1 };
  }

  getByYear(w: number) {
    this.currentYear = w;
    this.getStandingByYear(w)
    setTimeout(() => {
      // @ts-ignore
      this.ds.moveTo(w);
    }, 0);
    console.log(this.currentYear)
  }

  setPage(page : number) {
    this.currentPage = page;

  }
  getPage() {
    return this.standingsList.pipe(
        map(m=>{
          let offset = this.currentPage *(this.itemsPerPage + 1)
          console.log(offset)
          return m.splice(offset, this.itemsPerPage)
        })
    )
  }
}

import {Component, HostListener, Inject} from '@angular/core';
import {MdbAccordionModule} from "mdb-angular-ui-kit/accordion";
import {AsyncPipe, DOCUMENT, KeyValuePipe, NgClass, NgForOf, ViewportScroller} from "@angular/common";
import {NflDataService} from "../../../shared/services/nfl-data.service";
import {Observable} from "rxjs";
import {Week} from "../../../shared/model/Week";
import {Schedule_card} from "./table-data/schedule_card";
import {DragScrollComponent, DragScrollItemDirective} from "ngx-drag-scroll";

@Component({
  selector: 'app-sample-page2',
  standalone: true,
  imports: [
    MdbAccordionModule,
    KeyValuePipe,
    Schedule_card,
    DragScrollComponent,
    AsyncPipe,
    NgClass,
    NgForOf,
    DragScrollItemDirective
  ],
  templateUrl: './Schedule.component.html',
  styleUrl: './Schedule.component.scss'
})
export class ScheduleComponent {
  direction = "";
  protected schedules: Observable<any[]> = new Observable<any[]>()
  protected weeks: Observable<Week[]> = new Observable<Week[]>()
  protected currentSelection: Map<string, any[]> = new Map<string, any[]>()
  protected readonly Date = Date;

  isNavCollapse = false;
  protected currentWeek: number = 0
  protected scores: Map<number, any> = new Map();

  @HostListener('window:scroll', []) onScroll() {
    this.isNavCollapse = this.scroll.getScrollPosition()[1] > 70;
  }

  constructor(
      private scroll: ViewportScroller,
      @Inject(DOCUMENT) private document: Document,
      private nflData: NflDataService
  ) {
    let date = new Date()
    this.nflData.getWeekSchedule().then(it => {
      this.weeks = it;
    })
  }


  ngOnInit() {

  }
  getDataByWeek(week : number) {
    let date = new Date()
    this.nflData.getScoresbyWeek(date.getFullYear(),week ).then(t=>t.subscribe(sc=>{
      this.scores.clear()
      sc.forEach(fe=>this.scores.set(fe.GameKey, fe))
      console.log(this.scores.values())
    }))
    this.nflData.getSchedules(date.getFullYear(), week).then(t=>t.subscribe(sc =>{

      console.log(`current ${sc.values()}`)
      this.currentSelection = sc}))
  }

  groupBy(data: any[]) {
    let groupItems: { [key: string]: any[] } = {};
    let map: Map<String, any[]> = new Map();


    data.reduce(item => {
      let gameDate = new Date(item.Date.split("T")[0])

      let key = `${gameDate.getMonth()}-${gameDate.getDate()}`
      if (!key) {
        groupItems[key] = []
      }
      groupItems[key].push(item)

    })

    console.log(groupItems)
  }

  onWheel(event: WheelEvent): void {
    if (event.deltaY > 0) this.scrollToRight();
    else this.scrollToLeft();
  }

  scrollToLeft(): void {
    // @ts-ignore
    document.getElementById('scroll-1').scrollLeft -= 400;
  }

  scrollToRight(): void {
    document.getElementById('scroll-1')!.scrollLeft += 400;
  }


  isBetween(startDate: Date, endDate: Date) {
    let currentDate = new Date()
    return currentDate.getTime() >= startDate.getTime() && currentDate.getTime() <= endDate.getTime();
  }


  getScoreData(gameKey: any) {
    let score = this.scores.get(gameKey)
    console.log(score)
    return score
  }
}

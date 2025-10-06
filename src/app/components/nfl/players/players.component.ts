import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NflDataService} from "../../../shared/services/nfl-data.service";
import {AsyncPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {MdbRippleModule} from "mdb-angular-ui-kit/ripple";
import {ColDef} from "ag-grid-community";
import {Observable} from "rxjs";
import {AccordionTableComponent} from "./accordion-table/accordion-table.component";
import * as console from "console";

@Component({
    selector: 'app-players',
    imports: [
        NgForOf,
        NgIf,
        MdbRippleModule,
        AsyncPipe,
        NgClass,
        AccordionTableComponent
    ],
    templateUrl: './players.component.html',
    styleUrl: './players.component.scss'
})
export class PlayersComponent {

    protected id = 16815
    protected stats: any[] = []
    protected news: Observable<any[]>
    protected playerStats: Observable<any[]>
    protected player: Observable<any>;
    protected currentButton = "overview"
    protected subs : any[] = [1,2,3,4,5,6,7,8,9,10,11,12]

    name = 'Angular';

    rows = [
        {id: 1, desc: "foo", showDetail: false},
        {id: 2, desc: "bar", showDetail: false},
    ]


    constructor(private nflService: NflDataService) {
        nflService.getPlayerGameLogsBySeason(2024, this.id, 10).then(t =>
           this.playerStats = t
        )
        nflService.getPlayerNewsById(this.id).then(t =>
           this.news = t
        )

        nflService.getPlayerById(this.id).then(t=>this.player = t)


    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['defaultTab']) {
            this.onSubMenuClick(changes['defaultTab'].currentValue)
        }
    }

    onSubMenuClick(event: any) {
        this.currentButton = event.target.id
    }


}

import {Component, HostListener, Inject} from '@angular/core';
import {MdbAccordionModule} from "mdb-angular-ui-kit/accordion";
import {AsyncPipe, DOCUMENT, KeyValuePipe, NgClass, NgForOf, ViewportScroller} from "@angular/common";
import {NflDataService} from "../../../shared/services/nfl-data.service";
import {Observable} from "rxjs";
import {Week} from "../../../shared/model/Week";
import {DragScrollComponent, DragScrollItemDirective} from "ngx-drag-scroll";
import {ScoreCardComponent} from "./score-card/score-card.component";

export interface Team {
    logo: string;
    abbr: string;
    record: string;
    score?: number;
    quarters?: number[];
    isWinner?: boolean;
    hasPossession?: boolean;
}

export interface GameData {
    status: 'final' | 'live' | 'upcoming';
    tvNetwork: string;
    statusText: string;
    teams: Team[];
    location?: string;
    attendance?: string;
    footerText: string;
    gameTime?: string;
    weather?: string;
    line?: string;
}
@Component({
  selector: 'app-sample-page2',
  standalone: true,
    imports: [
        MdbAccordionModule,
        KeyValuePipe,
        DragScrollComponent,
        AsyncPipe,
        NgClass,
        NgForOf,
        DragScrollItemDirective,
        ScoreCardComponent
    ],
  templateUrl: './Schedule.component.html',
  styleUrl: './Schedule.component.scss'
})
export class ScheduleComponent {
    currentDate = 'Thursday, February 27, 2025';

    finalGame: GameData = {
        status: 'final',
        tvNetwork: 'FOX',
        statusText: 'Final',
        teams: [
            { logo: 'PHI', abbr: 'Eagles', record: '13-4', score: 40, quarters: [7, 17, 10, 6], isWinner: true },
            { logo: 'KC', abbr: 'Chiefs', record: '12-5', score: 22, quarters: [0, 0, 6, 16] }
        ],
        location: 'Caesars Superdome, New Orleans, LA',
        attendance: '65,719',
        footerText: 'Super Bowl LIX | Top Performers: J. Hurts: 328 YDS, 3 TD'
    };

    liveGame: GameData = {
        status: 'live',
        tvNetwork: 'CBS',
        statusText: '3rd Quarter',
        teams: [
            { logo: 'BAL', abbr: 'Ravens', record: '11-6', score: 21, quarters: [7, 14, 0] },
            { logo: 'CIN', abbr: 'Bengals', record: '10-7', score: 17, quarters: [3, 7, 7], hasPossession: true }
        ],
        gameTime: '4:32 remaining in 3rd quarter',
        location: 'CIN Ball on BAL 28',
        footerText: 'Week 9 Regular Season | AFC North Rivalry'
    };

    upcomingGame: GameData = {
        status: 'upcoming',
        tvNetwork: 'NBC',
        statusText: '8:20 PM ET',
        teams: [
            { logo: 'DAL', abbr: 'Cowboys', record: '9-7' },
            { logo: 'NYG', abbr: 'Giants', record: '7-9' }
        ],
        location: 'MetLife Stadium, East Rutherford, NJ',
        weather: '32°F, 10-15 mph winds',
        footerText: 'Week 9 Regular Season | Line: DAL -3.5'
    };
}

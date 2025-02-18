import {Component} from '@angular/core';
import {NgForOf} from "@angular/common";
import {MdbDropdownModule} from "mdb-angular-ui-kit/dropdown";
import passing from '../../../../assets/data/Passing.json'
import {MdbRippleModule} from "mdb-angular-ui-kit/ripple";

@Component({
    selector: 'app-team-stats',
    standalone: true,
    imports: [
        NgForOf,
        MdbDropdownModule,
        MdbRippleModule
    ],
    templateUrl: './team-stats.component.html',
    styleUrl: './team-stats.component.scss'
})
export class TeamStatsComponent {

    protected readonly passing = passing;
    protected selectedButton = ''
    protected dropdown = ['Passing', 'Rushing', 'Receiving', 'Defense', 'Kicking']
    protected headers : Map<string, any[]> = new Map()

    constructor() {
      this.headers.set('passing', ['Number','Team','G','CMP','ATT','PCT','YDS','YDS','LNG','TD','INT','SACK','YDS','RTG'])
      this.headers.set('rushing', ['G','CAR','YTDS','AVG','LNG','TD','YDS/G','FUM','FUML'])
      this.headers.set('receiving',['G','REC','TAR','YDS/GAVG','LNGTD','YDS/G','FUM','FUML'] )
      this.headers.set('defense', ['G','SOLO','AST','TOT','SACK','INT','TDFF','FR'])
      this.headers.set('kicking', ['G','SOLO','AST','TOT','SACK','INT','TDFF','FR'])
    }

  onSectionSelect($event: MouseEvent) {

  }
}

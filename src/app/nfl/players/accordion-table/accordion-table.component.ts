import {Component, Input} from '@angular/core';
import {Observable} from "rxjs";
import {AsyncPipe, NgClass, NgForOf} from "@angular/common";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {MdbTooltipModule} from "mdb-angular-ui-kit/tooltip";

@Component({
  selector: 'app-accordion-table',
  standalone: true,
  imports: [
    NgForOf,
    AsyncPipe,
    NgClass,
    MdbTooltipModule
  ],
  templateUrl: './accordion-table.component.html',
  styleUrl: './accordion-table.component.scss',
  animations: [
    trigger('widthGrow', [
      state('closed', style({
        width: 0,
      })),
      state('open', style({
        width: 400
      })),
      transition('* => *', animate(150))
    ]),
  ]
})
export class AccordionTableComponent {
  @Input()
  data : Observable<any[]>
  selectedRow : number = 0

  onRowClick(row : number) {
    this.selectedRow = row
  }
}

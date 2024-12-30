import { Component, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { NgbdSortableHeader, SortEvent } from '../../shared/directives/NgbdSortableHeader';
import { SupportTicketService } from '../../shared/services/support-ticket.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-support-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbdSortableHeader,NgbModule],
  templateUrl: './support-ticket.component.html',
  styleUrls: ['./support-ticket.component.scss'],
  providers: [SupportTicketService, DecimalPipe],

})
export class SupportTicketComponent implements OnInit {

  public selected = [];

  public tableItem$: Observable<any[]>;
  public searchText: any
  total$: Observable<number>;

  constructor(public service: SupportTicketService) {

    this.tableItem$ = service.support$;
    this.total$ = service.total$;

  }



  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    this.headers.forEach((header) => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });

    this.service.sortColumn = column;
    this.service.sortDirection = direction;

  }

  public onSelect(selected:any) {
    // this.service.deleteSingleData(selected);
  }


  ngOnInit() {
  }

}

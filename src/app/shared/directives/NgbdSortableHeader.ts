import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
export type SortColumn = any | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { asc: string; "": string; desc: string } = {
  asc: 'desc',
  desc: '',
  '': 'asc',
};

export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}


@Directive({
  standalone: true,
  selector: 'th[sortable]',
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
  },
})


export class NgbdSortableHeader {
  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  @HostListener('click', ['$event']) rotate() {
    console.info('clicked: ');
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }

}

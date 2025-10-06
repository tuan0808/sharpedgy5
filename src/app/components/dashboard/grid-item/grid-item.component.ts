import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";

@Component({
    selector: 'app-grid-item',
    imports: [
        NgClass,
        NgIf
    ],
    templateUrl: './grid-item.component.html',
    styleUrl: './grid-item.component.scss'
})
export class GridItemComponent {
  @Input() component: string;
  @Input() editMode: boolean;
  @Output() onDelete = new EventEmitter();
  @Output() onLockMove = new EventEmitter();
  @Output() onLockResize = new EventEmitter();

  moveEnabled = true;
  resizeEnabled = true;
}

import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterItem } from 'angular-gridster2';

@Component({
    selector: 'app-resizable-container',
    imports: [CommonModule],
    templateUrl: './resizable-container.component.html',
    styleUrls: ['./resizable-container.component.scss']
})
export class ResizableContainerComponent implements OnInit, GridsterItem {
  // GridsterItem required properties
  x: number = 0;
  y: number = 0;
  rows: number = 4;
  cols: number = 4;

  // Component properties
  @Input() isLocked: boolean = false;
  @Input() title: string = 'Container';

  @Output() removed = new EventEmitter<void>();
  @Output() lockChanged = new EventEmitter<boolean>();
  @Output() sizeReset = new EventEmitter<void>();

  // State for resize handles
  isResizing: boolean = false;
  resizeType: 'right' | 'bottom' | 'corner' | null = null;
  startDimensions = { width: 0, height: 0 };
  startPosition = { x: 0, y: 0 };

  ngOnInit() {
    // Initialize gridster item properties if provided
    if (this['item']) {
      this.x = this['item'].x || 0;
      this.y = this['item'].y || 0;
      this.rows = this[`item`].rows || 4;
      this.cols = this['item'].cols || 4;
    }
  }

  onLockToggle(): void {
    this.isLocked = !this.isLocked;
    this.lockChanged.emit(this.isLocked);
  }

  onRemove(): void {
    this.removed.emit();
  }

  onResetSize(): void {
    // Reset to default gridster size
    this.rows = 4;
    this.cols = 4;
    this.sizeReset.emit();
  }

  // Resize handle methods
  onResizeStart(event: MouseEvent, type: 'right' | 'bottom' | 'corner'): void {
    if (this.isLocked) return;

    event.preventDefault();
    this.isResizing = true;
    this.resizeType = type;

    this.startPosition = {
      x: event.clientX,
      y: event.clientY
    };

    this.startDimensions = {
      width: this.cols,
      height: this.rows
    };

    // Add global mouse event listeners
    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  private onResizeMove = (event: MouseEvent): void => {
    if (!this.isResizing || this.isLocked) return;

    const deltaX = event.clientX - this.startPosition.x;
    const deltaY = event.clientY - this.startPosition.y;

    // Convert pixel deltas to gridster units (approximate)
    const gridUnitX = Math.round(deltaX / 100); // Adjust divisor based on your grid size
    const gridUnitY = Math.round(deltaY / 100);

    if (this.resizeType === 'right' || this.resizeType === 'corner') {
      this.cols = Math.max(1, this.startDimensions.width + gridUnitX);
    }

    if (this.resizeType === 'bottom' || this.resizeType === 'corner') {
      this.rows = Math.max(1, this.startDimensions.height + gridUnitY);
    }
  };

  private onResizeEnd = (): void => {
    this.isResizing = false;
    this.resizeType = null;

    // Remove global mouse event listeners
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);
  };

  [propName: string]: any;
}

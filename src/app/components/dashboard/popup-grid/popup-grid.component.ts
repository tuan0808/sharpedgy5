import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DisplayGrid,
  GridsterComponent,
  GridsterConfig,
  GridsterItemComponent,
  GridType,
  CompactType,
} from 'angular-gridster2';
import { DynamicComponentDirective } from '../../../shared/directives/dynamic-component.directive';
import { DashboardItem } from '../../../shared/data/dashboard/DashboardItem';
import { ComponentRegistryService } from '../../../shared/services/component-registry.service';

@Component({
  selector: 'app-popup-grid',
  standalone: true,
  imports: [
    CommonModule,
    GridsterComponent,
    GridsterItemComponent,
    DynamicComponentDirective
  ],
  templateUrl: './popup-grid.component.html',
  styleUrls: ['./popup-grid.component.scss']
})
export class PopupGridComponent implements OnInit, OnDestroy {
  options: GridsterConfig;
  gridItems: DashboardItem[] = [];

  constructor(
      private componentRegistry: ComponentRegistryService,
      private cdr: ChangeDetectorRef
  ) {
    this.initializeGridster();
  }

  private initializeGridster() {
    const headerHeight = 50; // Smaller header for popup
    const availableHeight = window.innerHeight - headerHeight;
    const rowHeight = Math.floor(availableHeight / 12);

    this.options = {
      gridType: GridType.Fit,
      displayGrid: DisplayGrid.Always,
      pushItems: true,
      draggable: {
        enabled: true,
        dragHandleClass: 'drag-handler',
      },
      resizable: {
        enabled: true
      },
      minCols: 24,
      maxCols: 24,
      minRows: 12,
      maxRows: 12,
      fixedRowHeight: rowHeight,
      fixedColWidth: Math.floor(window.innerWidth / 24),
      margin: 5,
      outerMargin: true,
      useTransformPositioning: true,
      mobileBreakpoint: 640,
      compactType: CompactType.None,
      itemChangeCallback: (item) => {
        this.sendGridUpdate();
      }
    };

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.options.api && this.options.api.optionsChanged) {
        const newAvailableHeight = window.innerHeight - headerHeight;
        const newRowHeight = Math.floor(newAvailableHeight / 12);

        this.options.fixedRowHeight = newRowHeight;
        this.options.fixedColWidth = Math.floor(window.innerWidth / 24);
        this.options.api.optionsChanged();
      }
    });
  }

  ngOnInit() {
    // Listen for initial grid data from parent window
    window.addEventListener('message', this.handleParentMessage.bind(this));

    // Request initial data from parent
    window.opener.postMessage({ type: 'requestInitialData' }, '*');
  }

  ngOnDestroy() {
    // Notify parent window before closing
    window.opener.postMessage({
      type: 'popupClosing',
      items: this.gridItems
    }, '*');
    window.removeEventListener('message', this.handleParentMessage.bind(this));
  }

  private handleParentMessage(event: MessageEvent) {
    if (event.data.type === 'gridData') {
      this.gridItems = event.data.items;
      this.cdr.detectChanges();
    }
  }

  private sendGridUpdate() {
    window.opener.postMessage({
      type: 'gridUpdate',
      items: this.gridItems
    }, '*');
  }
}

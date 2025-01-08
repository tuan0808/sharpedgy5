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
import { AvailableComponent} from "../../../shared/model/dashboards/AvailableContent";


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
  sidenavOpen = false;
  availableComponents: AvailableComponent[] = [
    {
      name: 'Chart Widget',
      type: 'chart',
      icon: 'fas fa-chart-bar',
      defaultSize: { cols: 8, rows: 6 }
    },
    {
      name: 'Table Widget',
      type: 'table',
      icon: 'fas fa-table',
      defaultSize: { cols: 12, rows: 8 }
    },
    // Add more components as needed
  ];

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

  toggleSidenav() {
    this.sidenavOpen = !this.sidenavOpen;
  }

  onDragStart(event: DragEvent, component: AvailableComponent) {
    event.dataTransfer?.setData('componentType', component.type);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) return;

    const componentType = event.dataTransfer.getData('componentType');
    const component = this.availableComponents.find(c => c.type === componentType);

    if (component) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newItem: DashboardItem = {
        id: `widget-${Date.now()}`,
        cols: 6,
        rows: 4,
        x: Math.floor(x / (rect.width / 24)), // Adjust based on your grid
        y: Math.floor(y / (rect.height / 12)), // Adjust based on your grid
        component: componentType
      };

      this.gridItems.push(newItem);
      this.sendGridUpdate();
      this.cdr.detectChanges();
    }
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

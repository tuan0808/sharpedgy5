import {ComponentRef, Directive, Input, ViewContainerRef} from '@angular/core';
import {DashboardService} from "../services/dashboard.service";
import {ComponentRegistryService} from "../services/component-registry.service";
import {DashboardItem} from "../data/dashboard/DashboardItem";
import {GridsterConfig} from "angular-gridster2";

@Directive({
  selector: '[appDynamicComponent]',
  standalone: true
})
export class DynamicComponentDirective {
  options: GridsterConfig;
  gridItems: DashboardItem[] = [];

  constructor(private componentRegistry: ComponentRegistryService) {
    this.options = {
      gridType: 'fit',
      displayGrid: 'always',
      pushItems: true,
      draggable: {
        enabled: true
      },
      resizable: {
        enabled: true
      },
      minCols: 6,
      maxCols: 12,
      minRows: 6,
      maxRows: 12,
      defaultItemCols: 2,
      defaultItemRows: 2,
      mobileBreakpoint: 640
    };
  }

  ngOnInit() {
    this.gridItems = [
      { cols: 2, rows: 2, y: 0, x: 0, component: 'ComponentA', id: '1' },
      { cols: 3, rows: 2, y: 0, x: 2, component: 'ComponentB', id: '2' }
    ];
  }

  addItem() {
    this.gridItems.push({
      cols: 2,
      rows: 2,
      y: 0,
      x: 0,
      component: 'ComponentA',
      id: Date.now().toString()
    });
  }
}



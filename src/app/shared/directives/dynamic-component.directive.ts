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
}



import {
  Component,
  ComponentRef, Input,
  OnInit,
  QueryList,
  Type,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from "@angular/core";
import { ChartistModule } from "ng-chartist";
import { CommonModule } from "@angular/common";
import { FeatherIconsComponent } from "../../../shared/components/feather-icons/feather-icons.component";
import { NgApexchartsModule } from "ng-apexcharts";
import {
  CompactType, DisplayGrid, GridsterComponent, GridsterConfig, GridsterItem, GridsterItemComponent,
  GridType
} from "angular-gridster2";import {DynamicHostDirective} from "../../../shared/directives/dynamic-host.directive";
import {SidenavComponent} from "../sidenav/sidenav.component";
import {GridItemComponent} from "../grid-item/grid-item.component";

import {FormsModule} from "@angular/forms";
import {DynamicComponentDirective} from "../../../shared/directives/dynamic-component.directive";
import {ComponentRegistryService} from "../../../shared/services/component-registry.service";
import {DashboardItem} from "../../../shared/data/dashboard/DashboardItem";
import {AngularFireAuth} from "@angular/fire/compat/auth";
declare var require: any;

// var Knob = require('knob')// browserify require

var primary = localStorage.getItem("primary_color") || "#4466f2";
var secondary = localStorage.getItem("secondary_color") || "#1ea6ec";

@Component({
  selector: "app-default",
  standalone: true,
    imports: [CommonModule, FeatherIconsComponent, ChartistModule, NgApexchartsModule, GridsterItemComponent, GridsterComponent, DynamicHostDirective, GridItemComponent, SidenavComponent, FormsModule, DynamicComponentDirective],
  templateUrl: "./default.component.html",
  styleUrls: ["./default.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class DefaultComponent {
  options: GridsterConfig;
  gridItems: DashboardItem[] = [];

  constructor(private componentRegistry: ComponentRegistryService) {
    this.options = {
      gridType: 'fixed',
      fixedColWidth: 100,
      fixedRowHeight: 100,
      displayGrid: 'always',
      pushItems: true,
      draggable: {
        enabled: true
      },
      resizable: {
        enabled: true
      },
      margin: 10,
      outerMargin: true,
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

  onSave() {
    this.componentRegistry.save('9fa8b1c2-3456-78de-f901-23456abc9999', this.gridItems).then(r =>
    console.log('hi?'))
  }

  loadLayout() {
    const savedLayout = localStorage.getItem('gridsterLayout');
    if (savedLayout) {
      const layout = JSON.parse(savedLayout);
      this.gridItems = layout.items;
    }
  }
}

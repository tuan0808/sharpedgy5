import {Component, ComponentRef, OnInit, QueryList, ViewChildren, ViewEncapsulation} from "@angular/core";
import { ChartistModule } from "ng-chartist";
import { CommonModule } from "@angular/common";
import { FeatherIconsComponent } from "../../../shared/components/feather-icons/feather-icons.component";
import { NgApexchartsModule } from "ng-apexcharts";
import {
  DisplayGrid,
  GridsterComponent,
  GridsterConfig,
  GridsterItem,
  GridsterItemComponent,
  GridType
} from "angular-gridster2";
import {PlayersComponent} from "../../../nfl/players/players.component";
import {DynamicHostDirective} from "../../../shared/directives/dynamic-host.directive";
import {ComponentRegistryService} from "../../../shared/services/component-registry.service";
import {DashboardService} from "../../../shared/services/dashboard.service";
declare var require: any;
// var Knob = require('knob')// browserify require

var primary = localStorage.getItem("primary_color") || "#4466f2";
var secondary = localStorage.getItem("secondary_color") || "#1ea6ec";

@Component({
  selector: "app-default",
  standalone: true,
  imports: [CommonModule, FeatherIconsComponent, ChartistModule, NgApexchartsModule, GridsterItemComponent, GridsterComponent, DynamicHostDirective],
  templateUrl: "./default.component.html",
  styleUrls: ["./default.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class DefaultComponent {
  @ViewChildren(DynamicHostDirective) dynamicHosts: QueryList<DynamicHostDirective>;
  constructor(private componentRegistry : ComponentRegistryService, private dashboardService : DashboardService) {
    this.options = {
      gridType: GridType.Fit, // Fills the container
      compactType: null, // No auto-compacting
      margin: 10, // Margin between grid items
      outerMargin: true,
      minCols: 12,
      maxCols: 12,
      minRows: 12,
      maxRows: 12,
      draggable: {
        enabled: false // Allow drag
      },
      resizable: {
        enabled: true // Allow resize
      },
      displayGrid: 'always', // Show grid lines
    };

    this.dashboard = [
      { cols: 2, rows: 2, y: 0, x: 0, component: 'playerInfo' }, // Item 1
      { cols: 2, rows: 1, y: 0, x: 2, component: 'teams' }, // Item 2
      { cols: 1, rows: 2, y: 1, x: 4, component: 'scores'}, // Item 3
      { cols: 3, rows: 2, y: 2, x: 1, component: 'standing' }  // Item 4
    ];

  }

  ngAfterViewInit() {
    this.loadComponents();
  }


  options: GridsterConfig;
  dashboard: Array<GridsterItem>;

  onSaveEvent() {
    console.log(JSON.stringify(this.dashboard))
    this.dashboardService.saveDashboard(this.dashboard)
  }

  loadComponents() {
    this.dynamicHosts.forEach((dynamicHost, index) => {
     const componentName = this.dashboard[index]['component'];
      const componentType = this.componentRegistry.getComponent(componentName);

      const viewContainerRef = dynamicHost.viewContainerRef;
      viewContainerRef.clear();

      const componentRef = viewContainerRef.createComponent(componentType);
      // Pass data to component instance if necessary
    });
  }
  toggleDraggable() {
    this.options.draggable.enabled = !this.options.draggable.enabled;
    if (this.options.api && this.options.api.optionsChanged) {
      this.options.api.optionsChanged();
    }
  }
}

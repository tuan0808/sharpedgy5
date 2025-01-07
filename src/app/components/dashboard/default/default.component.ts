import {
    Component,
    ViewChild,
    ViewEncapsulation,
    OnInit
} from "@angular/core";
import {ChartistModule} from "ng-chartist";
import {CommonModule} from "@angular/common";
import {FeatherIconsComponent} from "../../../shared/components/feather-icons/feather-icons.component";
import {NgApexchartsModule} from "ng-apexcharts";
import {
    DisplayGrid,
    GridsterComponent,
    GridsterConfig,
    GridsterItemComponent,
    GridType,
    CompactType,
} from "angular-gridster2";
import {DynamicHostDirective} from "../../../shared/directives/dynamic-host.directive";
import {SidenavComponent} from "../sidenav/sidenav.component";
import {GridItemComponent} from "../grid-item/grid-item.component";
import {FormsModule} from "@angular/forms";
import {DynamicComponentDirective} from "../../../shared/directives/dynamic-component.directive";
import {ComponentRegistryService} from "../../../shared/services/component-registry.service";
import {DashboardItem} from "../../../shared/data/dashboard/DashboardItem";

@Component({
    selector: "app-default",
    standalone: true,
    imports: [CommonModule, FeatherIconsComponent, ChartistModule, NgApexchartsModule,
        GridsterItemComponent, GridsterComponent, DynamicHostDirective,
        GridItemComponent, SidenavComponent, FormsModule, DynamicComponentDirective],
    templateUrl: "./default.component.html",
    styleUrls: ["./default.component.scss"],
    encapsulation: ViewEncapsulation.None,
})
export class DefaultComponent implements OnInit {
    options: GridsterConfig;
    gridItems: DashboardItem[] = [];

    constructor(private componentRegistry: ComponentRegistryService) {
        this.initializeGridster();
    }

    private initializeGridster() {
        const headerHeight = 60; // Height of your header in pixels
        const availableHeight = window.innerHeight - headerHeight;
        const rowHeight = Math.floor(availableHeight / 12); // Divide available height into 12 rows

        this.options = {
            gridType: GridType.Fit, // Changed to Fit to ensure content stays within viewport
            displayGrid: DisplayGrid.Always,
            pushItems: true,
            draggable: {
                enabled: true,
                dragHandleClass: 'drag-handler', // Optional: add if you want specific drag zones
            },
            resizable: {
                enabled: true
            },
            minCols: 24,
            maxCols: 24,
            minRows: 12,
            maxRows: 12, // Set equal to minRows to prevent vertical expansion
            fixedRowHeight: rowHeight,
            fixedColWidth: Math.floor(window.innerWidth / 24),
            margin: 5,
            outerMargin: true,
            useTransformPositioning: true,
            mobileBreakpoint: 640,
            defaultItemCols: 4,
            defaultItemRows: 4,
            keepFixedHeightInMobile: true,
            keepFixedWidthInMobile: true,
            compactType: CompactType.None,
            enableEmptyCellClick: false,
            enableEmptyCellContextMenu: false,
            enableEmptyCellDrop: false,
            enableEmptyCellDrag: false,
            emptyCellDragMaxCols: 50,
            emptyCellDragMaxRows: 50,
            enableOccupiedCellDrop: false,
            swap: true,
            swapWhileDragging: false,
            pushDirections: { north: true, east: true, south: true, west: true },
            pushResizeItems: true,
            disableWindowResize: false,
            disableAutoPositionOnConflict: false,
            scrollToNewItems: false, // Disabled scrolling
            itemResizeCallback: item => {
                // Ensure grid updates properly after resize
                if (this.options.api && this.options.api.optionsChanged) {
                    this.options.api.optionsChanged();
                }
            },
            itemChangeCallback: item => {
                // Ensure grid updates properly after changes
                if (this.options.api && this.options.api.optionsChanged) {
                    this.options.api.optionsChanged();
                }
            }
        };

        // Add window resize handler
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
        this.gridItems = [
            {cols: 4, rows: 4, y: 0, x: 0, component: 'ComponentA', id: '1'},
            {cols: 4, rows: 4, y: 0, x: 4, component: 'ComponentB', id: '2'}
        ];
    }

    onSave() {
        this.componentRegistry.save('9fa8b1c2-3456-78de-f901-23456abc9999', 10, this.gridItems)
            .then(r => r.subscribe(s => console.log(s)));
    }


}

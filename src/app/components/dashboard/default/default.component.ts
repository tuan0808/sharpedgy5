import {
    Component,
    ViewChild,
    ViewEncapsulation,
    OnInit,
    OnDestroy,
    AfterViewInit,
    ChangeDetectorRef
} from "@angular/core";
import {ChartistModule} from "ng-chartist";
import {CommonModule} from "@angular/common";
import {FeatherIconsComponent} from "../../../shared/components/feather-icons/feather-icons.component";
import {NgApexchartsModule} from "ng-apexcharts";
import {GridState} from "../../../shared/model/GridState"
import {
    DisplayGrid,
    GridsterComponent,
    GridsterConfig,
    GridsterItem,
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
export class DefaultComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(GridsterComponent) gridster: GridsterComponent;
    protected options: GridsterConfig;
    protected gridItems: DashboardItem[] = [];
    protected popupWindow: Window | null = null;
    private gridHistory: GridState[] = [];
    private currentHistoryIndex: number = -1;
    private maxHistorySize: number = 20;
    private isUndoRedoOperation: boolean = false;

    private popupCheckInterval: number | null = null;

    constructor(private componentRegistry: ComponentRegistryService,
                private cdr: ChangeDetectorRef
    ) {
        this.initializeGridster();
    }

    private initializeGridster() {
        const headerHeight = 50;
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
            setGridSize: true,
            compactType: CompactType.None,
            disableWindowResize: false,
            disableAutoPositionOnConflict: false,
            keepFixedHeightInMobile: false,
            keepFixedWidthInMobile: false,
            enableEmptyCellClick: false,
            enableEmptyCellContextMenu: false,
            enableEmptyCellDrop: false,
            enableEmptyCellDrag: false,
            enableOccupiedCellDrop: false,
            enableOccupiedCellDrag: false,
            scrollSensitivity: 10,
            scrollSpeed: 20,
            initCallback: () => {
                console.log('Popup grid initialized');
            },

            itemChangeCallback: () => {
                if (!this.isUndoRedoOperation) {
                    this.addToHistory();
                }
                this.sendGridUpdate();
            }
        };

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

        // Initialize history with initial state
        this.addToHistory();

        window.addEventListener('message', this.handlePopupMessage.bind(this));
    }

    ngAfterViewInit() {
        if (this.gridster && this.gridster.options && this.gridster.options.api) {
            this.gridster.options.api.optionsChanged();
        }
    }

    ngOnDestroy() {
        window.removeEventListener('message', this.handlePopupMessage.bind(this));
        if (this.popupWindow) {
            this.popupWindow.close();
        }
        if (this.popupCheckInterval) {
            window.clearInterval(this.popupCheckInterval);
        }
    }

    openPopupGrid() {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.close();
        }

        const width = Math.min(1200, window.innerWidth * 0.8);
        const height = Math.min(800, window.innerHeight * 0.8);
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        this.popupWindow = window.open('/popup-grid', 'DashboardGrid',
            `width=${width},height=${height},left=${left},top=${top}`);

        if (this.popupWindow) {
            // Start checking if popup is closed
            this.popupCheckInterval = window.setInterval(() => {
                if (this.popupWindow && this.popupWindow.closed) {
                    this.handlePopupClosed();
                }
            }, 500);

            this.popupWindow.onbeforeunload = () => {
                this.handlePopupClosed();
            };

            // Trigger change detection to update the view
            this.cdr.detectChanges();
        }
    }

    private handlePopupClosed() {
        this.popupWindow = null;
        if (this.popupCheckInterval) {
            window.clearInterval(this.popupCheckInterval);
            this.popupCheckInterval = null;
        }
        this.cdr.detectChanges();
    }

    private handleParentMessage(event: MessageEvent) {
        if (event.data.type === 'gridData') {
            this.gridItems = event.data.items;
            if (this.options.api) {
                this.options.api.optionsChanged();
            }
            this.cdr.detectChanges();
        }
    }

    private sendGridUpdate() {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.postMessage({
                type: 'gridUpdate',
                items: this.gridItems
            }, '*');
        }
    }

    private handlePopupMessage(event: MessageEvent) {
        switch (event.data.type) {
            case 'requestInitialData':
                if (this.popupWindow) {
                    this.popupWindow.postMessage({
                        type: 'gridData',
                        items: this.gridItems
                    }, '*');
                }
                break;

            case 'gridUpdate':
                this.gridItems = event.data.items;
                if (this.options.api) {
                    this.options.api.optionsChanged();
                }
                this.cdr.detectChanges();
                break;

            case 'popupClosing':
                this.handlePopupClosed();
                break;
        }
    }

    private addToHistory() {
        // Remove any future states if we're not at the latest point
        if (this.currentHistoryIndex < this.gridHistory.length - 1) {
            this.gridHistory = this.gridHistory.slice(0, this.currentHistoryIndex + 1);
        }

        // Create a deep copy of the current state
        const newState: GridState = {
            items: this.gridItems.map(item => ({...item})),
            timestamp: Date.now()
        };

        // Add new state to history
        this.gridHistory.push(newState);
        this.currentHistoryIndex = this.gridHistory.length - 1;

        // Limit history size
        if (this.gridHistory.length > this.maxHistorySize) {
            this.gridHistory.shift();
            this.currentHistoryIndex--;
        }
    }

    canUndo(): boolean {
        return this.currentHistoryIndex > 0;
    }

    canRedo(): boolean {
        return this.currentHistoryIndex < this.gridHistory.length - 1;
    }

    undo() {
        if (this.canUndo()) {
            this.isUndoRedoOperation = true;
            this.currentHistoryIndex--;
            this.applyHistoryState(this.gridHistory[this.currentHistoryIndex]);
            this.isUndoRedoOperation = false;
        }
    }

    redo() {
        if (this.canRedo()) {
            this.isUndoRedoOperation = true;
            this.currentHistoryIndex++;
            this.applyHistoryState(this.gridHistory[this.currentHistoryIndex]);
            this.isUndoRedoOperation = false;
        }
    }

    private applyHistoryState(state: GridState) {
        this.gridItems = state.items.map(item => ({...item}));
        if (this.options.api) {
            this.options.api.optionsChanged();
        }
        this.sendGridUpdate();
        this.cdr.detectChanges();
    }

    onSave() {
        this.componentRegistry.save('9fa8b1c2-3456-78de-f901-23456abc9999', 10, this.gridItems)
            .then(r => r.subscribe(s => console.log(s)));
    }
}

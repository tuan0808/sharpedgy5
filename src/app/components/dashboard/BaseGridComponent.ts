import {
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    Directive,
    Inject,
    Optional,
    signal,
    computed,
    effect, inject, DestroyRef
} from '@angular/core';
import {
    DisplayGrid,
    GridsterConfig,
    GridType,
    CompactType,
} from 'angular-gridster2';
import { DashboardItem } from '../../shared/data/dashboard/DashboardItem';
import { ComponentRegistryService } from '../../shared/services/component-registry.service';
import { GridState } from '../../shared/model/GridState';
import {Dashboard} from "../../shared/data/dashboard/Dashboard";
import {AuthService} from "../../shared/services/auth.service";
import {map} from "rxjs/operators";
import {Auth} from "@angular/fire/auth";
import {Observable} from "rxjs";

@Directive()
export abstract class BaseGridComponent {
    protected options = signal<GridsterConfig>({
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
        margin: 10,
        outerMargin: true,
        useTransformPositioning: true,
        mobileBreakpoint: 640,
        compactType: CompactType.None,
    });

    // State signals
    protected currentDashboard = signal<Dashboard | null>(null);
    protected gridItems = signal<DashboardItem[]>([]);
    protected showGrid = signal(true);
    protected gridHistory = signal<GridState[]>([]);
    protected currentHistoryIndex = signal(-1);
    protected isUndoRedoOperation = signal(false);

    // Constants
    protected readonly maxHistorySize = 20;

    // Computed values
    protected canUndo = computed(() => this.currentHistoryIndex() > 0);
    protected canRedo = computed(() =>
        this.currentHistoryIndex() < this.gridHistory().length - 1
    );

    private destroyRef = inject(DestroyRef);

    protected constructor(
        protected componentRegistry: ComponentRegistryService,
        protected cdr: ChangeDetectorRef,
        protected auth: Auth
    ) {
        // Set up the options first
        this.options.update(current => ({
            ...current,
            itemChangeCallback: () => {
                if (!this.isUndoRedoOperation()) {
                    this.handleGridChange();
                }
            }
        }));

        // Then initialize gridster
        this.initializeGridster();

        // Finally initialize the component
        this.initializeComponent();

        // Cleanup on destroy
        this.destroyRef.onDestroy(() => {
            this.cleanup();
        });
    }

    // Abstract methods
    protected abstract handleItemChange(): void;
    protected abstract initializeComponent(): void;

    private handleGridChange(): void {
        if (!this.isUndoRedoOperation()) {
            // Ensure we're not duplicating history entries
            const lastHistoryState = this.gridHistory()[this.currentHistoryIndex()];
            const currentItems = this.gridItems();

            // Only add to history if the grid state has actually changed
            if (!lastHistoryState ||
                JSON.stringify(lastHistoryState.items) !== JSON.stringify(currentItems)) {
                this.addToHistory();
                this.handleItemChange();
            }
        }
    }

    protected addToHistory(): void {
        const currentState: GridState = {
            items: this.gridItems().map(item => ({...item})),
            timestamp: Date.now()
        };

        const currentIndex = this.currentHistoryIndex();
        const history = this.gridHistory().slice(0, currentIndex + 1);
        history.push(currentState);

        if (history.length > this.maxHistorySize) {
            history.shift();
            this.currentHistoryIndex.set(history.length - 2);
        } else {
            this.currentHistoryIndex.set(history.length - 1);
        }

        this.gridHistory.set(history);
    }

    undo(): void {
        if (this.canUndo()) {
            this.isUndoRedoOperation.set(true);
            const newIndex = this.currentHistoryIndex() - 1;
            this.currentHistoryIndex.set(newIndex);

            const state = this.gridHistory()[newIndex];
            this.gridItems.set(state.items.map(item => ({...item})));

            if (this.options().api) {
                this.options().api.optionsChanged();
            }

            this.handleItemChange();
            this.isUndoRedoOperation.set(false);
        }
    }

    redo(): void {
        if (this.canRedo()) {
            this.isUndoRedoOperation.set(true);
            const newIndex = this.currentHistoryIndex() + 1;
            this.currentHistoryIndex.set(newIndex);

            const state = this.gridHistory()[newIndex];
            this.gridItems.set(state.items.map(item => ({...item})));

            if (this.options().api) {
                this.options().api.optionsChanged();
            }

            this.handleItemChange();
            this.isUndoRedoOperation.set(false);
        }
    }

    protected initializeGridster(): void {
        const headerHeight = this.getHeaderHeight();
        const availableHeight = window.innerHeight - headerHeight;
        const rowHeight = Math.floor(availableHeight / 12);

        this.options.update(current => ({
            ...current,
            fixedRowHeight: rowHeight,
            fixedColWidth: Math.floor(window.innerWidth / 24),
        }));

        this.setupWindowResize(headerHeight);
    }

    protected setupWindowResize(headerHeight: number): void {
        const resizeHandler = () => {
            const newAvailableHeight = window.innerHeight - headerHeight;
            const newRowHeight = Math.floor(newAvailableHeight / 12);

            this.options.update(current => ({
                ...current,
                fixedRowHeight: newRowHeight,
                fixedColWidth: Math.floor(window.innerWidth / 24),
            }));
        };

        window.addEventListener('resize', resizeHandler);
        this.destroyRef.onDestroy(() => {
            window.removeEventListener('resize', resizeHandler);
        });
    }

    protected getHeaderHeight(): number {
        return 50;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        if (!event.dataTransfer) return;

        const componentType = event.dataTransfer.getData('componentType');
        const componentSize = JSON.parse(
            event.dataTransfer.getData('componentSize') ||
            '{"cols": 4, "rows": 4}'
        );

        const gridsterElement = document.querySelector('.gridster-container');
        if (!gridsterElement) return;

        const rect = gridsterElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const colWidth = rect.width / (this.options().minCols || 24);
        const rowHeight = rect.height / (this.options().minRows || 12);

        const gridX = Math.floor(x / colWidth);
        const gridY = Math.floor(y / rowHeight);

        const newItem: DashboardItem = {
            id: `widget-${Date.now()}`,
            cols: componentSize.cols,
            rows: componentSize.rows,
            x: Math.min(gridX, (this.options().minCols || 24) - componentSize.cols),
            y: Math.min(gridY, (this.options().minRows || 12) - componentSize.rows),
            component: componentType
        };

        // Update grid items
        this.gridItems.update(items => [...items, newItem]);

        // Explicitly add to history after adding the new item
        this.addToHistory();

        // Trigger item change handler
        this.handleItemChange();
    }

    toggleGrid(): void {
        this.showGrid.update(show => !show);
        this.options.update(current => ({
            ...current,
            displayGrid: this.showGrid() ? DisplayGrid.Always : DisplayGrid.None
        }));
    }


    protected async saveDashboardState(): Promise<void> {
        const dashboard = this.currentDashboard();
        if (dashboard && this.auth?.currentUser) {
            await this.componentRegistry.save(
                this.auth.currentUser.uid,
                dashboard.id,
                this.gridItems()
            );
        }
    }

    onDashboardChange(dashboard: Dashboard): void {
        this.saveDashboardState().then(() => {
            this.loadDashboard(dashboard.id);
        });
    }

    protected async loadDashboard(dashboardId: number): Promise<void> {
        const components = await this.componentRegistry.loadComponents(dashboardId);
        components.subscribe(items => {
            this.gridItems.set(items);
        });
    }

    protected cleanup(): void {
        // Override in child components if needed
    }
}

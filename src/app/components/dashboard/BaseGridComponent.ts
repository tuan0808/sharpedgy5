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
import {Auth} from "@angular/fire/auth";
import {firstValueFrom} from "rxjs";
import {ToastrService} from "ngx-toastr";

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

    //Save Index
    protected movesSinceLastSave = signal(0);
    protected readonly movesBeforeAutoSave = 20;
    protected hasUnsavedChanges = signal(false);
    protected lastSaveHistoryIndex = signal(0);

    // Constants
    protected readonly maxHistorySize = 20;

    // Computed values
    protected canUndo = computed(() => this.currentHistoryIndex() > 0);
    protected canRedo = computed(() =>
        this.currentHistoryIndex() < this.gridHistory().length - 1
    );

    private destroyRef = inject(DestroyRef);
    protected toastr = inject(ToastrService)
    protected constructor(
        protected componentRegistry: ComponentRegistryService,
        protected cdr: ChangeDetectorRef,
        protected auth: Auth,
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
        this.componentRegistry.getDefaultDashboard('a1c68108-50df-45bd-8d60-72e7db8894b6')
            .then(dashboardObservable => {
                dashboardObservable.subscribe({
                    next: (dashboard) => {
                        console.log('Dashboard received:', dashboard);

                        // Update the currentDashboard signal
                        this.currentDashboard.set(dashboard);

                        if (dashboard?.components) {
                            // Validate and adjust component positions
                            const validatedComponents = dashboard.components.map(comp => ({
                                ...comp,
                                // Ensure all required GridsterItem properties are present
                                x: Math.min(Math.max(0, comp.x), 20),
                                y: Math.min(Math.max(0, comp.y), 8),
                                cols: comp.cols || comp.defaultCols || 4,
                                rows: comp.rows || comp.defaultRows || 4,
                                // Ensure the component name matches what's registered
                                component: this.componentRegistry.getComponent(comp.component)
                                    ? comp.component
                                    : 'defaultComponent'
                            }));

                            console.log('Setting validated components:', validatedComponents);
                            this.gridItems.set(validatedComponents);
                            this.addToHistory();
                            this.cdr.detectChanges();
                        }
                    },
                    error: (error) => {
                        console.error('Dashboard subscription error:', error);
                        // Reset signals on error
                        this.currentDashboard.set(null);
                        this.gridItems.set([]);
                    }
                });
            })
            .catch(error => {
                console.error('Failed to get dashboard observable:', error);
                this.currentDashboard.set(null);
                this.gridItems.set([]);
            });

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
            const lastHistoryState = this.gridHistory()[this.currentHistoryIndex()];
            const currentItems = this.gridItems();

            if (!lastHistoryState ||
                JSON.stringify(lastHistoryState.items) !== JSON.stringify(currentItems)) {
                this.addToHistory();
                this.hasUnsavedChanges.set(true);
                this.handleItemChange();

                // Increment moves counter
                this.movesSinceLastSave.update(count => count + 1);

                // Check if we need to auto-save
                if (this.movesSinceLastSave() >= this.movesBeforeAutoSave) {
                    this.autoSaveDashboard();
                }
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

            this.movesSinceLastSave.update(count => count + 1);
            this.handleItemChange();
            this.isUndoRedoOperation.set(false);

            // Check if we need to auto-save
            if (this.movesSinceLastSave() >= this.movesBeforeAutoSave) {
                this.autoSaveDashboard();
            }
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

            this.movesSinceLastSave.update(count => count + 1);
            this.handleItemChange();
            this.isUndoRedoOperation.set(false);

            // Check if we need to auto-save
            if (this.movesSinceLastSave() >= this.movesBeforeAutoSave) {
                this.autoSaveDashboard();
            }
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

        // const newItem: DashboardItem = {
        //     id: `widget-${Date.now()}`,
        //     cols: componentSize.cols,
        //     rows: componentSize.rows,
        //     x: Math.min(gridX, (this.options().minCols || 24) - componentSize.cols),
        //     y: Math.min(gridY, (this.options().minRows || 12) - componentSize.rows),
        //     component: componentType
        //     category: ''
        //     defaultCols: 0,
        //     defaultRows: 0,
        // };
        //
        // // Update grid items
        // this.gridItems.update(items => [...items, newItem]);

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

    protected validateGridPosition(item: DashboardItem): DashboardItem {
        return {
            ...item,
            x: Math.min(Math.max(0, item.x), (this.options().maxCols || 24) - item.cols),
            y: Math.min(Math.max(0, item.y), (this.options().maxRows || 12) - item.rows)
        };
    }


    protected async saveDashboardState(): Promise<void> {
        // If we haven't made any moves since last save, don't save again
        if (this.movesSinceLastSave() === 0) {
            this.toastr.info('No changes to save');
            return;
        }

        try {
            const dashboard = this.currentDashboard();
            const components = this.gridItems().map(item => ({
                id: item.id,
                dashboardId: dashboard.id,
                x: Math.min(Math.max(0, item.x), this.options().maxCols! - (item.cols || 1)),
                y: Math.min(Math.max(0, item.y), this.options().maxRows! - (item.rows || 1)),
                cols: item.cols || item.defaultCols || 4,
                rows: item.rows || item.defaultRows || 4,
                component: item.component
            }));

            await firstValueFrom(this.componentRegistry.updateComponents(
                dashboard.id,
                components
            ));

            // Reset moves counter and saved state
            this.movesSinceLastSave.set(0);
            this.hasUnsavedChanges.set(false);
            this.lastSaveHistoryIndex.set(this.currentHistoryIndex());

            // Show manual save notification
            this.toastr.success('Dashboard saved');

        } catch (error) {
            console.error('Error saving dashboard state:', error);
            this.toastr.error('Failed to save dashboard');
            throw error;
        }
    }



    private async autoSaveDashboard(): Promise<void> {
        try {
            const dashboard = this.currentDashboard();
            const components = this.gridItems().map(item => ({
                id: item.id,
                dashboardId: dashboard.id,
                x: Math.min(Math.max(0, item.x), this.options().maxCols! - (item.cols || 1)),
                y: Math.min(Math.max(0, item.y), this.options().maxRows! - (item.rows || 1)),
                cols: item.cols || item.defaultCols || 4,
                rows: item.rows || item.defaultRows || 4,
                component: item.component
            }));

            await firstValueFrom(this.componentRegistry.updateComponents(
                dashboard.id,
                components
            ));

            // Reset moves counter and saved state
            this.movesSinceLastSave.set(0);
            this.hasUnsavedChanges.set(false);
            this.lastSaveHistoryIndex.set(this.currentHistoryIndex());

            // Show auto-save notification
            this.toastr.info('Dashboard auto-saved');

        } catch (error) {
            console.error('Error auto-saving dashboard state:', error);
            this.toastr.error('Failed to auto-save dashboard');
            throw error;
        }
    }



    // Add method to check for unsaved changes
    protected async checkUnsavedChanges(): Promise<boolean> {
        if (this.hasUnsavedChanges()) {
            return new Promise((resolve) => {
                const result = window.confirm('You have unsaved changes. Do you want to continue without saving?');
                resolve(result);
            });
        }
        return true;
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

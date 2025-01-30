import {
    OnDestroy,
    ChangeDetectorRef,
    Directive,
    inject,
    DestroyRef,
    signal,
    computed, effect
} from '@angular/core';
import {
    DisplayGrid,
    GridsterConfig,
    GridType,
    CompactType,
} from 'angular-gridster2';
import { Auth } from "@angular/fire/auth";
import { firstValueFrom } from "rxjs";
import { ToastrService } from "ngx-toastr";

// Internal imports
import { DashboardItem } from '../../shared/data/dashboard/DashboardItem';
import { ComponentRegistryService } from '../../shared/services/component-registry.service';
import { GridState } from '../../shared/model/GridState';
import { Dashboard } from "../../shared/data/dashboard/Dashboard";
import {AuthService} from "../../shared/services/auth.service";
import {UIDFormatter} from "../../shared/utils/UUIDFormatter";

/**
 * Base class for grid-based dashboard components.
 * Provides core functionality for grid management, undo/redo operations,
 * and dashboard state persistence.
 */
@Directive()
export abstract class BaseGridComponent {
    // region Configuration Constants
    private static readonly MAX_HISTORY_SIZE = 20;
    private static readonly MOVES_BEFORE_AUTO_SAVE = 20;
    private static readonly DEFAULT_HEADER_HEIGHT = 50;
    private static readonly GRID_DIMENSIONS = {
        minCols: 24,
        maxCols: 24,
        minRows: 12,
        maxRows: 12,
        margin: 10
    };
    // endregion

    // region Signals
    // Grid Configuration
    protected options = signal<GridsterConfig>(this.getDefaultGridConfig());
    protected showGrid = signal(true);

    // Dashboard State
    protected currentDashboard = signal<Dashboard | null>(null);
    protected gridItems = signal<DashboardItem[]>([]);

    // History Management
    protected gridHistory = signal<GridState[]>([]);
    protected currentHistoryIndex = signal(-1);
    protected isUndoRedoOperation = signal(false);

    // Save State
    protected movesSinceLastSave = signal(0);
    protected hasUnsavedChanges = signal(false);
    protected lastSaveHistoryIndex = signal(0);

    // Computed Properties
    protected canUndo = computed(() => this.currentHistoryIndex() > 0);
    protected canRedo = computed(() =>
        this.currentHistoryIndex() < this.gridHistory().length - 1
    );
    // endregion

    // region Dependencies
    private destroyRef = inject(DestroyRef);
    protected toastr = inject(ToastrService);

    // endregion

    protected constructor(
        protected componentRegistry: ComponentRegistryService,
        protected cdr: ChangeDetectorRef,
        protected auth: AuthService,
    ) {
        this.initializeGridster();
        this.initializeDashboard();
        this.setupCleanup();
    }

    // region Abstract Methods
    protected abstract handleItemChange(): void;
    protected abstract initializeComponent(): void;
    // endregion

    // region Initialization Methods
    private getDefaultGridConfig(): GridsterConfig {
        return {
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
            ...BaseGridComponent.GRID_DIMENSIONS,
            outerMargin: true,
            useTransformPositioning: true,
            mobileBreakpoint: 640,
            compactType: CompactType.None,
            itemChangeCallback: () => {
                if (!this.isUndoRedoOperation()) {
                    this.handleGridChange();
                }
            }
        };
    }

    private initializeDashboard(): void {
        var uuid = computed(() => console.log(`UUID ` + JSON.stringify(this.auth.currentUser())))
        uuid()
        effect(() => {
            if (this.auth.isAuthReady()) {
                const user = this.auth.currentUser();
                if (user) {
                    this.componentRegistry.getDefaultDashboard(user.uid)
                        .then(dashboardObservable => {
                            dashboardObservable.subscribe({
                                next: this.handleDashboardLoad.bind(this),
                                error: this.handleDashboardError.bind(this)
                            });
                        })
                        .catch(this.handleDashboardError.bind(this));
                    console.log('User UUID:', UIDFormatter.format(user.uid));

                }
            } else {

            }
        });

    }

    protected initializeGridster(): void {
        const headerHeight = this.getHeaderHeight();
        this.updateGridDimensions(headerHeight);
        this.setupWindowResize(headerHeight);
    }

    private setupCleanup(): void {
        this.destroyRef.onDestroy(() => {
            this.cleanup();
        });
    }
    // endregion

    // region Event Handlers
    private handleDashboardLoad(dashboard: Dashboard): void {
        console.log('Dashboard received:', dashboard);
        this.currentDashboard.set(dashboard);

        if (dashboard?.components) {
            const validatedComponents = this.validateComponents(dashboard.components);
            console.log('Setting validated components:', validatedComponents);
            this.gridItems.set(validatedComponents);
            this.addToHistory();
            this.cdr.detectChanges();
        }
    }

    private handleDashboardError(error: any): void {
        console.error('Dashboard error:', error);
        this.currentDashboard.set(null);
        this.gridItems.set([]);
    }

    private handleGridChange(): void {
        if (this.isUndoRedoOperation()) return;

        const lastHistoryState = this.gridHistory()[this.currentHistoryIndex()];
        const currentItems = this.gridItems();

        if (!lastHistoryState ||
            JSON.stringify(lastHistoryState.items) !== JSON.stringify(currentItems)) {
            this.addToHistory();
            this.hasUnsavedChanges.set(true);
            this.handleItemChange();
            this.incrementMovesCounter();
        }
    }
    // endregion

    // region History Management
    protected addToHistory(): void {
        const currentState: GridState = {
            items: this.gridItems().map(item => ({...item})),
            timestamp: Date.now()
        };

        const currentIndex = this.currentHistoryIndex();
        const history = this.gridHistory().slice(0, currentIndex + 1);
        history.push(currentState);

        if (history.length > BaseGridComponent.MAX_HISTORY_SIZE) {
            history.shift();
            this.currentHistoryIndex.set(history.length - 2);
        } else {
            this.currentHistoryIndex.set(history.length - 1);
        }

        this.gridHistory.set(history);
    }

    undo(): void {
        if (!this.canUndo()) return;

        this.isUndoRedoOperation.set(true);
        const newIndex = this.currentHistoryIndex() - 1;
        this.applyHistoryState(newIndex);
        this.isUndoRedoOperation.set(false);
    }

    redo(): void {
        if (!this.canRedo()) return;

        this.isUndoRedoOperation.set(true);
        const newIndex = this.currentHistoryIndex() + 1;
        this.applyHistoryState(newIndex);
        this.isUndoRedoOperation.set(false);
    }

    private applyHistoryState(index: number): void {
        this.currentHistoryIndex.set(index);
        const state = this.gridHistory()[index];
        this.gridItems.set(state.items.map(item => ({...item})));

        if (this.options().api) {
            this.options().api.optionsChanged();
        }

        this.incrementMovesCounter();
        this.handleItemChange();
    }
    // endregion

    // region Save Management
    protected async saveDashboardState(): Promise<void> {
        if (this.movesSinceLastSave() === 0) {
            this.toastr.info('No changes to save');
            return;
        }

        try {
            await this.saveComponents();
            this.updateSaveState(true);
        } catch (error) {
            console.error('Error saving dashboard state:', error);
            this.toastr.error('Failed to save dashboard');
            throw error;
        }
    }

    private async autoSaveDashboard(): Promise<void> {
        try {
            await this.saveComponents();
            this.updateSaveState(false);
        } catch (error) {
            console.error('Error auto-saving dashboard state:', error);
            this.toastr.error('Failed to auto-save dashboard');
            throw error;
        }
    }

    private async saveComponents(): Promise<void> {
        const dashboard = this.currentDashboard();
        const components = this.prepareComponentsForSave();

        await firstValueFrom(
            this.componentRegistry.updateComponents(dashboard.id, components)
        );
    }

    private updateSaveState(isManualSave: boolean): void {
        this.movesSinceLastSave.set(0);
        this.hasUnsavedChanges.set(false);
        this.lastSaveHistoryIndex.set(this.currentHistoryIndex());

        if (isManualSave) {
            this.toastr.success('Dashboard saved');
        } else {
            this.toastr.info('Dashboard auto-saved');
        }
    }
    // endregion

    // region Utility Methods
    private incrementMovesCounter(): void {
        this.movesSinceLastSave.update(count => count + 1);

        if (this.movesSinceLastSave() >= BaseGridComponent.MOVES_BEFORE_AUTO_SAVE) {
            this.autoSaveDashboard();
        }
    }

    protected validateComponents(components: DashboardItem[]): DashboardItem[] {
        return components.map(comp => ({
            ...comp,
            x: Math.min(Math.max(0, comp.x), 20),
            y: Math.min(Math.max(0, comp.y), 8),
            cols: comp.cols || comp.defaultCols || 4,
            rows: comp.rows || comp.defaultRows || 4,
            component: this.componentRegistry.getComponent(comp.component)
                ? comp.component
                : 'defaultComponent'
        }));
    }

    private prepareComponentsForSave(): any[] {
        const dashboard = this.currentDashboard();
        return this.gridItems().map(item => ({
            id: item.id,
            dashboardId: dashboard.id,
            x: Math.min(Math.max(0, item.x), this.options().maxCols! - (item.cols || 1)),
            y: Math.min(Math.max(0, item.y), this.options().maxRows! - (item.rows || 1)),
            cols: item.cols || item.defaultCols || 4,
            rows: item.rows || item.defaultRows || 4,
            component: item.component
        }));
    }

    protected getHeaderHeight(): number {
        return BaseGridComponent.DEFAULT_HEADER_HEIGHT;
    }

    private updateGridDimensions(headerHeight: number): void {
        const availableHeight = window.innerHeight - headerHeight;
        const rowHeight = Math.floor(availableHeight / 12);

        this.options.update(current => ({
            ...current,
            fixedRowHeight: rowHeight,
            fixedColWidth: Math.floor(window.innerWidth / 24),
        }));
    }
    // endregion

    // region Event Handlers
    protected setupWindowResize(headerHeight: number): void {
        const resizeHandler = () => this.updateGridDimensions(headerHeight);
        window.addEventListener('resize', resizeHandler);
        this.destroyRef.onDestroy(() => {
            window.removeEventListener('resize', resizeHandler);
        });
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

        this.addToHistory();
        this.handleItemChange();
    }

    toggleGrid(): void {
        this.showGrid.update(show => !show);
        this.options.update(current => ({
            ...current,
            displayGrid: this.showGrid() ? DisplayGrid.Always : DisplayGrid.None
        }));
    }

    async checkUnsavedChanges(): Promise<boolean> {
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
    // endregion

    protected cleanup(): void {
        // Override in child components if needed
    }
}

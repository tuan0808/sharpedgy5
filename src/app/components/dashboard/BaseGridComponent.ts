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
import {Router} from "@angular/router";

/**
 * Base class for grid-based dashboard components.
 * Provides core functionality for grid management, undo/redo operations,
 * and dashboard state persistence.
 */
@Directive()
export abstract class BaseGridComponent {
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

    private destroyRef = inject(DestroyRef);
    protected toastr = inject(ToastrService);
    protected router = inject(Router);

    constructor(
        protected componentRegistry: ComponentRegistryService,
        protected cdr: ChangeDetectorRef,
        protected readonly auth: AuthService
    ) {
        this.initializeComponent();
        this.setupCleanup();
    }

    protected abstract initializeComponent(): void;

    private getDefaultGridConfig(): GridsterConfig {
        return {
            gridType: GridType.Fit,
            displayGrid: DisplayGrid.Always,
            pushItems: true,
            draggable: {
                enabled: this.auth.isAuthenticated(),
                dragHandleClass: 'drag-handler',
            },
            resizable: {
                enabled: this.auth.isAuthenticated()
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

    protected async checkUnsavedChanges(): Promise<boolean> {
        if (!this.hasUnsavedChanges()) return true;
        return window.confirm('You have unsaved changes. Do you want to continue?');
    }

    protected addToHistory(): void {
        if (!this.auth.isAuthenticated()) return;

        const currentState: GridState = {
            items: this.gridItems().map(item => ({...item})),
            timestamp: Date.now()
        };

        let history = [...this.gridHistory()];
        history = history.slice(0, this.currentHistoryIndex() + 1);
        history.push(currentState);

        if (history.length > BaseGridComponent.MAX_HISTORY_SIZE) {
            history.shift();
            this.currentHistoryIndex.update(val => val - 1);
        }

        this.gridHistory.set(history);
        this.currentHistoryIndex.update(val => val + 1);
        this.movesSinceLastSave.update(val => val + 1);
        this.hasUnsavedChanges.set(true);
    }

    protected async saveDashboardState(): Promise<void> {
        if (!this.auth.isAuthenticated()) {
            this.toastr.warning('Please log in to save changes');
            return;
        }

        if (!this.hasUnsavedChanges()) {
            this.toastr.info('No changes to save');
            return;
        }

        try {
            await this.saveComponents();
            this.movesSinceLastSave.set(0);
            this.hasUnsavedChanges.set(false);
            this.lastSaveHistoryIndex.set(this.currentHistoryIndex());
            this.toastr.success('Dashboard saved successfully');
        } catch (error) {
            console.error('Error saving dashboard:', error);
            this.toastr.error('Failed to save dashboard');
        }
    }

    protected async loadDashboard(dashboardId: string): Promise<void> {
        if (!this.auth.isAuthenticated()) {
            this.toastr.warning('Please log in to load dashboards');
            return;
        }

        try {
            const dashboardData = await firstValueFrom(
                await this.componentRegistry.loadComponents(dashboardId)
            );

            if (dashboardData) {
                this.gridItems.set(dashboardData);
                this.addToHistory();
                this.toastr.success('Dashboard loaded successfully');
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.toastr.error('Failed to load dashboard');
        }
    }

    private async saveComponents(): Promise<void> {
        if (!this.currentDashboard() || !this.auth.isAuthenticated()) return;

        await firstValueFrom(
            this.componentRegistry.updateComponents(
                this.currentDashboard().id,
                this.gridItems()
            )
        );
    }

    protected toggleGrid(): void {
        this.showGrid.update(show => !show);
    }

    protected undo(): void {
        if (!this.canUndo() || !this.auth.isAuthenticated()) return;

        this.isUndoRedoOperation.set(true);
        this.currentHistoryIndex.update(val => val - 1);
        this.gridItems.set(this.gridHistory()[this.currentHistoryIndex()].items);
        this.isUndoRedoOperation.set(false);
        this.hasUnsavedChanges.set(true);
    }

    protected redo(): void {
        if (!this.canRedo() || !this.auth.isAuthenticated()) return;

        this.isUndoRedoOperation.set(true);
        this.currentHistoryIndex.update(val => val + 1);
        this.gridItems.set(this.gridHistory()[this.currentHistoryIndex()].items);
        this.isUndoRedoOperation.set(false);
        this.hasUnsavedChanges.set(true);
    }

    protected handleGridChange(): void {
        this.addToHistory();

        if (this.movesSinceLastSave() >= BaseGridComponent.MOVES_BEFORE_AUTO_SAVE) {
            this.saveDashboardState();
        }
    }

    protected onDrop(event: DragEvent): void {
        if (!this.auth.isAuthenticated()) {
            this.toastr.warning('Please log in to add components');
            return;
        }

        event.preventDefault();
        // Implementation for drag and drop functionality
    }

    private setupCleanup(): void {
        this.destroyRef.onDestroy(() => {
            this.cleanup();
        });
    }

    protected cleanup(): void {
        if (this.hasUnsavedChanges()) {
            const shouldSave = window.confirm('You have unsaved changes. Would you like to save before leaving?');
            if (shouldSave) {
                this.saveDashboardState();
            }
        }
    }

    ngOnDestroy(): void {
        this.cleanup();
    }
}

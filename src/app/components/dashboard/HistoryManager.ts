// history-manager.ts
import { ChangeDetectorRef } from '@angular/core';
import { GridsterConfig } from 'angular-gridster2';
import {GridState} from "../../shared/model/GridState";
import {DashboardItem} from "../../shared/data/dashboard/DashboardItem";

export abstract class HistoryManager {
    protected gridHistory: GridState[] = [];
    protected currentHistoryIndex: number = -1;
    protected maxHistorySize: number = 20;
    protected isUndoRedoOperation: boolean = false;

    protected constructor(
        protected gridItems: DashboardItem[],
        protected options: GridsterConfig,
        protected cdr: ChangeDetectorRef
    ) {
        this.initializeHistory();
    }

    protected initializeHistory(): void {
        this.addToHistory();
    }

    protected addToHistory(): void {
        if (this.isUndoRedoOperation) return;

        if (this.currentHistoryIndex < this.gridHistory.length - 1) {
            this.gridHistory = this.gridHistory.slice(0, this.currentHistoryIndex + 1);
        }

        const newState: GridState = {
            items: this.gridItems.map(item => ({...item})),
            timestamp: Date.now()
        };

        this.gridHistory.push(newState);
        this.currentHistoryIndex = this.gridHistory.length - 1;

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

    undo(): void {
        if (this.canUndo()) {
            this.isUndoRedoOperation = true;
            this.currentHistoryIndex--;
            this.applyHistoryState(this.gridHistory[this.currentHistoryIndex]);
            this.isUndoRedoOperation = false;
        }
    }

    redo(): void {
        if (this.canRedo()) {
            this.isUndoRedoOperation = true;
            this.currentHistoryIndex++;
            this.applyHistoryState(this.gridHistory[this.currentHistoryIndex]);
            this.isUndoRedoOperation = false;
        }
    }

    protected applyHistoryState(state: GridState): void {
        this.gridItems = state.items.map(item => ({...item}));
        if (this.options.api) {
            this.options.api.optionsChanged();
        }
        this.onHistoryStateApplied();
        this.cdr.detectChanges();
    }

    // Hook for components to implement additional logic after state change
    protected abstract onHistoryStateApplied(): void;
}

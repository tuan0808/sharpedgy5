import {Component, ChangeDetectorRef, Optional, DestroyRef, signal, afterNextRender} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GridsterComponent, GridsterItemComponent} from 'angular-gridster2';
import {DynamicComponentDirective} from '../../../shared/directives/dynamic-component.directive';
import {ComponentRegistryService} from '../../../shared/services/component-registry.service';
import {AvailableComponent} from "../../../shared/model/dashboards/AvailableContent";
import {BaseGridComponent} from '../BaseGridComponent';
import {Auth} from "@angular/fire/auth";

@Component({
    selector: 'app-popup-grid',
    standalone: true,
    imports: [
        CommonModule,
        GridsterComponent,
        GridsterItemComponent,
        DynamicComponentDirective
    ],
    templateUrl: './popup-grid.component.html',
    styleUrls: ['./popup-grid.component.scss']
})
export class PopupGridComponent extends BaseGridComponent {
    sidenavOpen = signal(false);
    availableComponents = signal<AvailableComponent[]>([
        {
            name: 'Chart Widget',
            type: 'chart',
            icon: 'fas fa-chart-bar',
            defaultSize: {cols: 8, rows: 6}
        },
        {
            name: 'Table Widget',
            type: 'table',
            icon: 'fas fa-table',
            defaultSize: {cols: 12, rows: 8}
        }
    ]);

    constructor(
        componentRegistry: ComponentRegistryService,
        cdr: ChangeDetectorRef,
        auth: Auth
    ) {
        super(componentRegistry, cdr, auth);
    }

    protected initializeComponent(): void {
        afterNextRender(() => {
            window.addEventListener('message', this.handleParentMessage.bind(this));
            window.opener.postMessage({type: 'requestInitialData'}, '*');
        });
    }

    protected handleItemChange(): void {
        this.sendGridUpdate();
    }

    protected override cleanup(): void {
        window.opener.postMessage({
            type: 'popupClosing',
            items: this.gridItems()
        }, '*');
        window.removeEventListener('message', this.handleParentMessage.bind(this));
    }

    toggleSidenav(): void {
        this.sidenavOpen.update(value => !value);
    }

    onDragStart(event: DragEvent, component: AvailableComponent): void {
        if (!event.dataTransfer) return;
        event.dataTransfer.setData('componentType', component.type);
        event.dataTransfer.setData('componentSize', JSON.stringify(component.defaultSize));
    }

    private handleParentMessage(event: MessageEvent): void {
        if (event.data.type === 'gridData') {
            this.gridItems.set(event.data.items);
        }
    }

    private sendGridUpdate(): void {
        window.opener.postMessage({
            type: 'gridUpdate',
            items: this.gridItems()
        }, '*');
    }
}

import {
    Component,
    ViewChild,
    ViewEncapsulation,
    ChangeDetectorRef,
    AfterViewInit,
    afterNextRender, afterRender, effect, signal, computed, DestroyRef
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {ChartistModule} from "ng-chartist";
import {FeatherIconsComponent} from "../../../shared/components/feather-icons/feather-icons.component";
import {NgApexchartsModule} from "ng-apexcharts";
import {GridsterComponent, GridsterItemComponent} from "angular-gridster2";
import {DynamicHostDirective} from "../../../shared/directives/dynamic-host.directive";
import {SidenavComponent} from "../sidenav/sidenav.component";
import {GridItemComponent} from "../grid-item/grid-item.component";
import {FormsModule} from "@angular/forms";
import {DynamicComponentDirective} from "../../../shared/directives/dynamic-component.directive";
import {ComponentRegistryService} from "../../../shared/services/component-registry.service";
import {BaseGridComponent} from '../BaseGridComponent';
import {Auth} from "@angular/fire/auth";
import {Observable} from "rxjs";
import {AuthService} from "../../../shared/services/auth.service";

@Component({
    selector: "app-default",
    standalone: true,
    imports: [
        CommonModule,
        FeatherIconsComponent,
        ChartistModule,
        NgApexchartsModule,
        GridsterItemComponent,
        GridsterComponent,
        DynamicHostDirective,
        GridItemComponent,
        SidenavComponent,
        FormsModule,
        DynamicComponentDirective,
    ],
    templateUrl: "./default.component.html",
    styleUrls: ["./default.component.scss"],
    encapsulation: ViewEncapsulation.None,
})
export class DefaultComponent extends BaseGridComponent {
    @ViewChild(GridsterComponent) gridster: GridsterComponent;
    protected popupWindow = signal<Window | null>(null);
    private popupCheckInterval = signal<number | null>(null);
    protected isPopupOpen = computed(() => this.popupWindow() !== null);

    constructor(
        componentRegistry: ComponentRegistryService,
        cdr: ChangeDetectorRef,
        auth: AuthService
    ) {
        super(componentRegistry, cdr, auth);
        console.log(JSON.stringify(auth.currentUser))
        // Initialize dashboard subscription properly

    }

    protected initializeComponent(): void {
        afterNextRender(() => {
            // Only set up event listeners here
            window.addEventListener('message', this.handlePopupMessage.bind(this));

            // Initialize gridster options
            if (this.gridster?.options?.api) {
                this.gridster.options.api.optionsChanged();
            }
        });
    }

    async closePopupGrid(): Promise<void> {
        if (this.popupWindow() && !this.popupWindow()?.closed) {
            // Save the current dashboard state
            await this.saveDashboardState();

            // Close the popup window
            this.popupWindow()?.close();
            this.handlePopupClosed();
        }
    }

    protected handleItemChange(): void {
        this.sendGridUpdate();
    }

    protected override cleanup(): void {
        if (this.hasUnsavedChanges()) {
            const shouldContinue = window.confirm('You have unsaved changes. Do you want to continue without saving?');
            if (!shouldContinue) {
                return;
            }
        }

        super.cleanup();
        window.removeEventListener('message', this.handlePopupMessage.bind(this));
        if (this.popupWindow()) {
            this.popupWindow()?.close();
        }
        if (this.popupCheckInterval()) {
            window.clearInterval(this.popupCheckInterval());
        }
    }

    async openPopupGrid() {
        if (!await this.checkUnsavedChanges()) {
            return;
        }

        if (this.popupWindow() && !this.popupWindow()?.closed) {
            this.popupWindow()?.close();
        }

        const width = Math.min(1200, window.innerWidth * 0.8);
        const height = Math.min(800, window.innerHeight * 0.8);
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const newPopup = window.open('/popup-grid', 'DashboardGrid',
            `width=${width},height=${height},left=${left},top=${top}`);

        this.popupWindow.set(newPopup);
        this.setupPopupChecks();
    }



    private setupPopupChecks() {
        if (this.popupCheckInterval()) {
            window.clearInterval(this.popupCheckInterval());
        }

        const intervalId = window.setInterval(() => {
            if (this.popupWindow()?.closed) {
                this.handlePopupClosed();
            }
        }, 500);

        this.popupCheckInterval.set(intervalId);

        if (this.popupWindow()) {
            this.popupWindow().onbeforeunload = () => {
                this.handlePopupClosed();
            };
        }
    }

    private handlePopupClosed() {
        this.popupWindow.set(null);
        if (this.popupCheckInterval()) {
            window.clearInterval(this.popupCheckInterval());
            this.popupCheckInterval.set(null);
        }
    }

    private handlePopupMessage(event: MessageEvent) {
        switch (event.data.type) {
            case 'requestInitialData':
                if (this.popupWindow()) {
                    this.popupWindow()?.postMessage({
                        type: 'gridData',
                        items: this.gridItems()
                    }, '*');
                }
                break;
            case 'gridUpdate':
                // Uncomment and update this section to handle grid updates from popup
                this.gridItems.set(event.data.items);
                if (this.gridster?.options?.api) {
                    this.gridster.options.api.optionsChanged();
                }
                break;
            case 'popupClosing':
                this.gridItems.set(event.data.items);
                this.saveDashboardState().then(() => {
                    this.handlePopupClosed();
                });
                break;
        }
    }

    private sendGridUpdate() {
        if (this.popupWindow() && !this.popupWindow()?.closed) {
            this.popupWindow()?.postMessage({
                type: 'gridUpdate',
                items: this.gridItems()
            }, '*');
        }
    }
}

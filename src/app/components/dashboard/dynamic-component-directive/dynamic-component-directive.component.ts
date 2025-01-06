import {ComponentRef, Directive, Input, OnDestroy, OnInit, ViewContainerRef} from "@angular/core";
import {DashboardService} from "../../../shared/services/dashboard.service";

@Directive({
  standalone: true,
  selector: '[dynamicComponent]'
})
export class DynamicComponentDirective implements OnInit, OnDestroy {
  @Input() componentType: string;
  @Input() data: any;
  private component: ComponentRef<any>;

  constructor(
      private viewContainer: ViewContainerRef,
      private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    const componentClass = this.dashboardService.getComponent(this.componentType);
    this.component = this.viewContainer.createComponent(componentClass);
    if (this.data) {
      Object.assign(this.component.instance, this.data);
    }
  }

  ngOnDestroy() {
    if (this.component) {
      this.component.destroy();
    }
  }
}

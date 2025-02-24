import { Directive, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import {ActuatorService} from "../services/actuator.service";

@Directive({
    standalone: true,
    selector: '[appServiceDependent]'
})
export class HealthCheckDirective {
    private actuatorService = inject(ActuatorService);
    private statusSignal = this.actuatorService.statusSignal;

    constructor(
    ) {
        effect(() => {
            const status = this.statusSignal();
            if (status === 'UP') {
               // this.viewContainer.createEmbeddedView(this.templateRef);
            } else {
               // this.viewContainer.clear();
            }
        });
    }
}

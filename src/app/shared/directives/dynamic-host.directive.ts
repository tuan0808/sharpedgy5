import {Directive, Input, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appDynamicHost]',
  standalone: true
})
export class DynamicHostDirective {
    @Input() componentType!: string;

  constructor(public viewContainerRef : ViewContainerRef ) { }

}

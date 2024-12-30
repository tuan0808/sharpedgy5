import { Directive, HostListener } from "@angular/core";
declare var require: any;
// var screenfull = require("screenfull");
@Directive({
  standalone:true,
  selector: "[toggleFullscreen]",
})
export class ToggleFullscreenDirective {
  @HostListener("click") onClick() {
   //  if (screenfull.enabled) {
   //    screenfull.toggle();
   //  }
  }
}

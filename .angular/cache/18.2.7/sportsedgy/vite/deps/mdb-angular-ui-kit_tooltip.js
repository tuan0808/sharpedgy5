import {
  ComponentPortal,
  Overlay,
  OverlayConfig,
  OverlayModule,
  OverlayPositionBuilder
} from "./chunk-PGWN2OFG.js";
import "./chunk-R7NHI74K.js";
import {
  animate,
  state,
  style,
  transition,
  trigger
} from "./chunk-2RXN4JMV.js";
import {
  CommonModule,
  NgIf
} from "./chunk-ZEUGVJVL.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  NgModule,
  Output,
  setClassMetadata,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-KXLRHXDW.js";
import "./chunk-O2NNWYVB.js";
import {
  fromEvent
} from "./chunk-KFYVUQAE.js";
import {
  Subject,
  first,
  takeUntil
} from "./chunk-CQ56QLPW.js";
import "./chunk-JNWOCGHM.js";
import "./chunk-KTESVR3Q.js";

// node_modules/mdb-angular-ui-kit/fesm2022/mdb-angular-ui-kit-tooltip.mjs
function MdbTooltipComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 2);
    ɵɵlistener("@fade.done", function MdbTooltipComponent_div_0_Template_div_animation_fade_done_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onAnimationEnd($event));
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("@fade", ctx_r1.animationState)("@.disabled", !ctx_r1.animation)("innerHTML", ctx_r1.title, ɵɵsanitizeHtml);
  }
}
function MdbTooltipComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 3);
    ɵɵlistener("@fade.done", function MdbTooltipComponent_div_1_Template_div_animation_fade_done_0_listener($event) {
      ɵɵrestoreView(_r3);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onAnimationEnd($event));
    });
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("@fade", ctx_r1.animationState)("@.disabled", !ctx_r1.animation);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.title, "\n");
  }
}
var MdbTooltipComponent = class _MdbTooltipComponent {
  _cdRef;
  title;
  html;
  animation;
  tooltip = true;
  _hidden = new Subject();
  animationState = "hidden";
  constructor(_cdRef) {
    this._cdRef = _cdRef;
  }
  markForCheck() {
    this._cdRef.markForCheck();
  }
  onAnimationEnd(event) {
    if (event.toState === "hidden") {
      this._hidden.next();
    }
  }
  static ɵfac = function MdbTooltipComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbTooltipComponent)(ɵɵdirectiveInject(ChangeDetectorRef));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _MdbTooltipComponent,
    selectors: [["mdb-tooltip"]],
    hostVars: 2,
    hostBindings: function MdbTooltipComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("tooltip", ctx.tooltip);
      }
    },
    inputs: {
      title: "title",
      html: "html",
      animation: "animation"
    },
    decls: 2,
    vars: 2,
    consts: [["class", "tooltip-inner", 3, "innerHTML", 4, "ngIf"], ["class", "tooltip-inner", 4, "ngIf"], [1, "tooltip-inner", 3, "innerHTML"], [1, "tooltip-inner"]],
    template: function MdbTooltipComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵtemplate(0, MdbTooltipComponent_div_0_Template, 1, 3, "div", 0)(1, MdbTooltipComponent_div_1_Template, 2, 3, "div", 1);
      }
      if (rf & 2) {
        ɵɵproperty("ngIf", ctx.html);
        ɵɵadvance();
        ɵɵproperty("ngIf", !ctx.html);
      }
    },
    dependencies: [NgIf],
    encapsulation: 2,
    data: {
      animation: [trigger("fade", [state("visible", style({
        opacity: 1
      })), state("hidden", style({
        opacity: 0
      })), transition("visible => hidden", animate("150ms linear")), transition(":enter", animate("150ms linear"))])]
    },
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbTooltipComponent, [{
    type: Component,
    args: [{
      selector: "mdb-tooltip",
      changeDetection: ChangeDetectionStrategy.OnPush,
      animations: [trigger("fade", [state("visible", style({
        opacity: 1
      })), state("hidden", style({
        opacity: 0
      })), transition("visible => hidden", animate("150ms linear")), transition(":enter", animate("150ms linear"))])],
      template: '<div\n  *ngIf="html"\n  [@fade]="animationState"\n  (@fade.done)="onAnimationEnd($event)"\n  [@.disabled]="!animation"\n  [innerHTML]="title"\n  class="tooltip-inner"\n></div>\n<div\n  *ngIf="!html"\n  [@fade]="animationState"\n  (@fade.done)="onAnimationEnd($event)"\n  [@.disabled]="!animation"\n  class="tooltip-inner"\n>\n  {{ title }}\n</div>\n'
    }]
  }], () => [{
    type: ChangeDetectorRef
  }], {
    title: [{
      type: Input
    }],
    html: [{
      type: Input
    }],
    animation: [{
      type: Input
    }],
    tooltip: [{
      type: HostBinding,
      args: ["class.tooltip"]
    }]
  });
})();
var MdbTooltipDirective = class _MdbTooltipDirective {
  _overlay;
  _overlayPositionBuilder;
  _elementRef;
  mdbTooltip = "";
  tooltipDisabled = false;
  placement = "top";
  html = false;
  animation = true;
  trigger = "hover focus";
  delayShow = 0;
  delayHide = 0;
  offset = 0;
  tooltipShow = new EventEmitter();
  tooltipShown = new EventEmitter();
  tooltipHide = new EventEmitter();
  tooltipHidden = new EventEmitter();
  _overlayRef;
  _tooltipRef;
  _open = false;
  _showTimeout = 0;
  _hideTimeout = 0;
  _destroy$ = new Subject();
  constructor(_overlay, _overlayPositionBuilder, _elementRef) {
    this._overlay = _overlay;
    this._overlayPositionBuilder = _overlayPositionBuilder;
    this._elementRef = _elementRef;
  }
  ngOnInit() {
    if (this.tooltipDisabled || this.mdbTooltip === "") {
      return;
    }
    this._bindTriggerEvents();
  }
  ngOnDestroy() {
    if (this._open || this._showTimeout) {
      this.hide();
    }
    this._destroy$.next();
    this._destroy$.complete();
  }
  _bindTriggerEvents() {
    const triggers = this.trigger.split(" ");
    triggers.forEach((trigger2) => {
      if (trigger2 === "click") {
        fromEvent(this._elementRef.nativeElement, trigger2).pipe(takeUntil(this._destroy$)).subscribe(() => this.toggle());
      } else if (trigger2 !== "manual") {
        const evIn = trigger2 === "hover" ? "mouseenter" : "focusin";
        const evOut = trigger2 === "hover" ? "mouseleave" : "focusout";
        fromEvent(this._elementRef.nativeElement, evIn).pipe(takeUntil(this._destroy$)).subscribe(() => this.show());
        fromEvent(this._elementRef.nativeElement, evOut).pipe(takeUntil(this._destroy$)).subscribe(() => this.hide());
      }
    });
  }
  _createOverlayConfig() {
    const positionStrategy = this._overlayPositionBuilder.flexibleConnectedTo(this._elementRef).withPositions(this._getPosition());
    const overlayConfig = new OverlayConfig({
      hasBackdrop: false,
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
      positionStrategy
    });
    return overlayConfig;
  }
  _createOverlay() {
    this._overlayRef = this._overlay.create(this._createOverlayConfig());
  }
  _getPosition() {
    let position;
    const positionTop = {
      originX: "center",
      originY: "top",
      overlayX: "center",
      overlayY: "bottom",
      offsetY: -this.offset
    };
    const positionBottom = {
      originX: "center",
      originY: "bottom",
      overlayX: "center",
      overlayY: "top",
      offsetY: this.offset
    };
    const positionRight = {
      originX: "end",
      originY: "center",
      overlayX: "start",
      overlayY: "center",
      offsetX: this.offset
    };
    const positionLeft = {
      originX: "start",
      originY: "center",
      overlayX: "end",
      overlayY: "center",
      offsetX: -this.offset
    };
    switch (this.placement) {
      case "top":
        position = [positionTop, positionBottom];
        break;
      case "bottom":
        position = [positionBottom, positionTop];
        break;
      case "left":
        position = [positionLeft, positionRight];
        break;
      case "right":
        position = [positionRight, positionLeft];
        break;
      default:
        break;
    }
    return position;
  }
  show() {
    if (this._hideTimeout || this._open) {
      this._overlayRef.detach();
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
    this._createOverlay();
    this._showTimeout = setTimeout(() => {
      if (!this._overlayRef.hasAttached()) {
        const tooltipPortal = new ComponentPortal(MdbTooltipComponent);
        this.tooltipShow.emit(this);
        this._open = true;
        this._tooltipRef = this._overlayRef.attach(tooltipPortal);
        this._tooltipRef.instance.title = this.mdbTooltip;
        this._tooltipRef.instance.html = this.html;
        this._tooltipRef.instance.animation = this.animation;
        this._tooltipRef.instance.animationState = "visible";
        this._tooltipRef.instance.markForCheck();
        this.tooltipShown.emit(this);
      }
    }, this.delayShow);
  }
  hide() {
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
      this._showTimeout = null;
    } else {
      return;
    }
    this._hideTimeout = setTimeout(() => {
      this.tooltipHide.emit(this);
      if (!this._tooltipRef) {
        this._overlayRef.detach();
        this._open = false;
        this.tooltipHidden.emit(this);
      } else {
        this._tooltipRef.instance._hidden.pipe(first()).subscribe(() => {
          this._overlayRef.detach();
          this._open = false;
          this.tooltipHidden.emit(this);
        });
        this._tooltipRef.instance.animationState = "hidden";
        this._tooltipRef.instance.markForCheck();
      }
    }, this.delayHide);
  }
  toggle() {
    if (this._open) {
      this.hide();
    } else {
      this.show();
    }
  }
  static ɵfac = function MdbTooltipDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbTooltipDirective)(ɵɵdirectiveInject(Overlay), ɵɵdirectiveInject(OverlayPositionBuilder), ɵɵdirectiveInject(ElementRef));
  };
  static ɵdir = ɵɵdefineDirective({
    type: _MdbTooltipDirective,
    selectors: [["", "mdbTooltip", ""]],
    inputs: {
      mdbTooltip: "mdbTooltip",
      tooltipDisabled: "tooltipDisabled",
      placement: "placement",
      html: "html",
      animation: "animation",
      trigger: "trigger",
      delayShow: "delayShow",
      delayHide: "delayHide",
      offset: "offset"
    },
    outputs: {
      tooltipShow: "tooltipShow",
      tooltipShown: "tooltipShown",
      tooltipHide: "tooltipHide",
      tooltipHidden: "tooltipHidden"
    },
    exportAs: ["mdbTooltip"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbTooltipDirective, [{
    type: Directive,
    args: [{
      // eslint-disable-next-line @angular-eslint/directive-selector
      selector: "[mdbTooltip]",
      exportAs: "mdbTooltip"
    }]
  }], () => [{
    type: Overlay
  }, {
    type: OverlayPositionBuilder
  }, {
    type: ElementRef
  }], {
    mdbTooltip: [{
      type: Input
    }],
    tooltipDisabled: [{
      type: Input
    }],
    placement: [{
      type: Input
    }],
    html: [{
      type: Input
    }],
    animation: [{
      type: Input
    }],
    trigger: [{
      type: Input
    }],
    delayShow: [{
      type: Input
    }],
    delayHide: [{
      type: Input
    }],
    offset: [{
      type: Input
    }],
    tooltipShow: [{
      type: Output
    }],
    tooltipShown: [{
      type: Output
    }],
    tooltipHide: [{
      type: Output
    }],
    tooltipHidden: [{
      type: Output
    }]
  });
})();
var MdbTooltipModule = class _MdbTooltipModule {
  static ɵfac = function MdbTooltipModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbTooltipModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MdbTooltipModule,
    declarations: [MdbTooltipDirective, MdbTooltipComponent],
    imports: [CommonModule, OverlayModule],
    exports: [MdbTooltipDirective, MdbTooltipComponent]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, OverlayModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbTooltipModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule, OverlayModule],
      declarations: [MdbTooltipDirective, MdbTooltipComponent],
      exports: [MdbTooltipDirective, MdbTooltipComponent]
    }]
  }], null, null);
})();
export {
  MdbTooltipComponent,
  MdbTooltipDirective,
  MdbTooltipModule
};
//# sourceMappingURL=mdb-angular-ui-kit_tooltip.js.map

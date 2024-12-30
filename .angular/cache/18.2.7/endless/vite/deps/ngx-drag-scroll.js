import {
  DOCUMENT
} from "./chunk-EXCOEW4E.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Inject,
  Input,
  Output,
  Renderer2,
  ViewChild,
  setClassMetadata,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdirectiveInject,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵqueryRefresh,
  ɵɵresolveWindow,
  ɵɵstyleProp,
  ɵɵviewQuery
} from "./chunk-OHH2VIM7.js";
import "./chunk-O2NNWYVB.js";
import "./chunk-KFYVUQAE.js";
import "./chunk-CQ56QLPW.js";
import "./chunk-JNWOCGHM.js";
import "./chunk-TWWAJFRB.js";

// node_modules/ngx-drag-scroll/fesm2022/ngx-drag-scroll.mjs
var _c0 = ["contentRef"];
var _c1 = ["*"];
var DragScrollItemDirective = class _DragScrollItemDirective {
  get dragDisabled() {
    return this._dragDisabled;
  }
  set dragDisabled(value) {
    this._dragDisabled = value;
  }
  constructor(elementRef) {
    this.display = "inline-block";
    this._dragDisabled = false;
    this._elementRef = elementRef;
  }
  static {
    this.ɵfac = function DragScrollItemDirective_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _DragScrollItemDirective)(ɵɵdirectiveInject(ElementRef));
    };
  }
  static {
    this.ɵdir = ɵɵdefineDirective({
      type: _DragScrollItemDirective,
      selectors: [["", "drag-scroll-item", ""]],
      hostVars: 2,
      hostBindings: function DragScrollItemDirective_HostBindings(rf, ctx) {
        if (rf & 2) {
          ɵɵstyleProp("display", ctx.display);
        }
      },
      inputs: {
        dragDisabled: [0, "drag-disabled", "dragDisabled"]
      },
      standalone: true
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DragScrollItemDirective, [{
    type: Directive,
    args: [{
      selector: "[drag-scroll-item]",
      standalone: true
    }]
  }], () => [{
    type: ElementRef,
    decorators: [{
      type: Inject,
      args: [ElementRef]
    }]
  }], {
    display: [{
      type: HostBinding,
      args: ["style.display"]
    }],
    dragDisabled: [{
      type: Input,
      args: ["drag-disabled"]
    }]
  });
})();
var DragScrollComponent = class _DragScrollComponent {
  /**
   * Is the user currently dragging the element
   */
  get isDragging() {
    return this._isDragging;
  }
  get currIndex() {
    return this._index;
  }
  set currIndex(value) {
    if (value !== this._index) {
      this._index = value;
      this.indexChanged.emit(value);
    }
  }
  /**
   * Whether the scrollbar is hidden
   */
  get scrollbarHidden() {
    return this._scrollbarHidden;
  }
  set scrollbarHidden(value) {
    this._scrollbarHidden = value;
  }
  /**
   * Whether horizontally and vertically draging and scrolling is be disabled
   */
  get disabled() {
    return this._disabled;
  }
  set disabled(value) {
    this._disabled = value;
  }
  /**
   * Whether horizontally dragging and scrolling is be disabled
   */
  get xDisabled() {
    return this._xDisabled;
  }
  set xDisabled(value) {
    this._xDisabled = value;
  }
  /**
   * Whether vertically dragging and scrolling events is disabled
   */
  get yDisabled() {
    return this._yDisabled;
  }
  set yDisabled(value) {
    this._yDisabled = value;
  }
  /**
   * Whether scrolling horizontally with mouse wheel is enabled
   */
  get xWheelEnabled() {
    return this._xWheelEnabled;
  }
  set xWheelEnabled(value) {
    this._xWheelEnabled = value;
  }
  get dragDisabled() {
    return this._dragDisabled;
  }
  set dragDisabled(value) {
    this._dragDisabled = value;
  }
  get snapDisabled() {
    return this._snapDisabled;
  }
  set snapDisabled(value) {
    this._snapDisabled = value;
  }
  get snapOffset() {
    return this._snapOffset;
  }
  set snapOffset(value) {
    this._snapOffset = value;
  }
  get snapDuration() {
    return this._snapDuration;
  }
  set snapDuration(value) {
    this._snapDuration = value;
  }
  constructor(_elementRef, _renderer, _document) {
    this._elementRef = _elementRef;
    this._renderer = _renderer;
    this._document = _document;
    this._index = 0;
    this._scrollbarHidden = false;
    this._disabled = false;
    this._xDisabled = false;
    this._xWheelEnabled = false;
    this._yDisabled = false;
    this._dragDisabled = false;
    this._snapDisabled = false;
    this._snapOffset = 0;
    this._snapDuration = 500;
    this._isDragging = false;
    this.isPressed = false;
    this.isScrolling = false;
    this.scrollTimer = -1;
    this.scrollToTimer = -1;
    this.downX = 0;
    this.downY = 0;
    this.displayType = "block";
    this.elWidth = null;
    this.elHeight = null;
    this._pointerEvents = "auto";
    this.scrollbarWidth = null;
    this.isAnimating = false;
    this.prevChildrenLength = 0;
    this.indexBound = 0;
    this.rtl = false;
    this.dsInitialized = new EventEmitter();
    this.indexChanged = new EventEmitter();
    this.reachesLeftBound = new EventEmitter();
    this.reachesRightBound = new EventEmitter();
    this.snapAnimationFinished = new EventEmitter();
    this.dragStart = new EventEmitter();
    this.dragEnd = new EventEmitter();
    this.scrollbarWidth = `${this.getScrollbarWidth()}px`;
  }
  ngOnChanges() {
    this.setScrollBar();
    if (this.xDisabled || this.disabled || this._scrollbarHidden) {
      this.disableScroll("x");
    } else {
      this.enableScroll("x");
    }
    if (this.yDisabled || this.disabled) {
      this.disableScroll("y");
    } else {
      this.enableScroll("y");
    }
  }
  ngAfterViewInit() {
    this._renderer.setAttribute(this._contentRef.nativeElement, "drag-scroll", "true");
    this.displayType = typeof window !== "undefined" ? window.getComputedStyle(this._elementRef.nativeElement).display : "block";
    this._renderer.setStyle(this._contentRef.nativeElement, "display", this.displayType);
    this._renderer.setStyle(this._contentRef.nativeElement, "whiteSpace", "noWrap");
    this.markElDimension();
    this._renderer.setStyle(this._contentRef.nativeElement, "width", this.elWidth);
    this._renderer.setStyle(this._contentRef.nativeElement, "height", this.elHeight);
    if (this.wrapper) {
      this.checkScrollbar();
    }
    this._onMouseDownListener = this._renderer.listen(this._contentRef.nativeElement, "mousedown", this.onMouseDownHandler.bind(this));
    this._onScrollListener = this._renderer.listen(this._contentRef.nativeElement, "scroll", this.onScrollHandler.bind(this));
    this._onDragStartListener = this._renderer.listen(this._contentRef.nativeElement, "dragstart", (e) => {
      e.preventDefault();
    });
    this.checkNavStatus();
    this.dsInitialized.emit();
    this.adjustMarginToLastChild();
    this.rtl = getComputedStyle(this._contentRef.nativeElement).getPropertyValue("direction") === "rtl";
  }
  ngAfterViewChecked() {
    if (this._children.length !== this.prevChildrenLength) {
      this.markElDimension();
      this.checkScrollbar();
      this.prevChildrenLength = this._children.length;
      this.checkNavStatus();
    }
  }
  ngOnDestroy() {
    this._renderer.setAttribute(this._contentRef.nativeElement, "drag-scroll", "false");
    if (this._onMouseDownListener) {
      this._onMouseDownListener = this._onMouseDownListener();
    }
    if (this._onScrollListener) {
      this._onScrollListener = this._onScrollListener();
    }
    if (this._onDragStartListener) {
      this._onDragStartListener = this._onDragStartListener();
    }
  }
  onMouseMoveHandler(event) {
    this.onMouseMove(event);
  }
  onMouseMove(event) {
    if (event.clientX === this.downX && event.clientY === this.downY) {
      return;
    }
    if (this.isPressed && !this.disabled) {
      if (!event.buttons && !event.which) {
        return this.onMouseUpHandler(event);
      }
      this._pointerEvents = "none";
      this._setIsDragging(true);
      if (!this.xDisabled && !this.dragDisabled) {
        const clientX = event.clientX;
        this._contentRef.nativeElement.scrollLeft = this._contentRef.nativeElement.scrollLeft - clientX + this.downX;
        this.downX = clientX;
      }
      if (!this.yDisabled && !this.dragDisabled) {
        const clientY = event.clientY;
        this._contentRef.nativeElement.scrollTop = this._contentRef.nativeElement.scrollTop - clientY + this.downY;
        this.downY = clientY;
      }
    }
  }
  onMouseDownHandler(event) {
    const dragScrollItem = this.locateDragScrollItem(event.target);
    if (dragScrollItem && dragScrollItem.dragDisabled) {
      return;
    }
    const isTouchEvent = event.type === "touchstart";
    this._startGlobalListening(isTouchEvent);
    this.isPressed = true;
    const mouseEvent = event;
    this.downX = mouseEvent.clientX;
    this.downY = mouseEvent.clientY;
    clearTimeout(this.scrollToTimer);
  }
  onScrollHandler() {
    this.checkNavStatus();
    if (!this.isPressed && !this.isAnimating && !this.snapDisabled) {
      this.isScrolling = true;
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => {
        this.isScrolling = false;
        this.locateCurrentIndex(true);
      }, 500);
    } else {
      this.locateCurrentIndex();
    }
  }
  onMouseUpHandler(event) {
    if (this.isPressed) {
      this.isPressed = false;
      this._pointerEvents = "auto";
      this._setIsDragging(false);
      if (!this.snapDisabled) {
        this.locateCurrentIndex(true);
      } else {
        this.locateCurrentIndex();
      }
      this._stopGlobalListening();
    }
  }
  /*
   * Nav button
   */
  moveLeft() {
    if (this.currIndex !== 0 || this.snapDisabled) {
      this.currIndex--;
      clearTimeout(this.scrollToTimer);
      this.scrollTo(this._contentRef.nativeElement, this.toChildrenLocation(), this.snapDuration);
    }
  }
  moveRight() {
    const container = this.wrapper || this.parentNode;
    const containerWidth = container ? container.clientWidth : 0;
    if (!this.isScrollReachesRightEnd() && this.currIndex < this.maximumIndex(containerWidth, this._children.toArray())) {
      this.currIndex++;
      clearTimeout(this.scrollToTimer);
      this.scrollTo(this._contentRef.nativeElement, this.toChildrenLocation(), this.snapDuration);
    }
  }
  moveTo(index) {
    const container = this.wrapper || this.parentNode;
    const containerWidth = container ? container.clientWidth : 0;
    if (index >= 0 && index !== this.currIndex && this.currIndex <= this.maximumIndex(containerWidth, this._children.toArray())) {
      this.currIndex = Math.min(index, this.maximumIndex(containerWidth, this._children.toArray()));
      clearTimeout(this.scrollToTimer);
      this.scrollTo(this._contentRef.nativeElement, this.toChildrenLocation(), this.snapDuration);
    }
  }
  checkNavStatus() {
    setTimeout(() => {
      const onlyOneItem = Boolean(this._children.length <= 1);
      const containerIsLargerThanContent = Boolean(this._contentRef.nativeElement.scrollWidth <= this._contentRef.nativeElement.clientWidth);
      if (onlyOneItem || containerIsLargerThanContent) {
        this.reachesLeftBound.emit(true);
        this.reachesRightBound.emit(true);
      } else if (this.isScrollReachesRightEnd()) {
        this.reachesLeftBound.emit(false);
        this.reachesRightBound.emit(true);
      } else if (this._contentRef.nativeElement.scrollLeft === 0 && this._contentRef.nativeElement.scrollWidth > this._contentRef.nativeElement.clientWidth) {
        this.reachesLeftBound.emit(true);
        this.reachesRightBound.emit(false);
      } else {
        this.reachesLeftBound.emit(false);
        this.reachesRightBound.emit(false);
      }
    }, 0);
  }
  onWheel(event) {
    if (this._xWheelEnabled) {
      event.preventDefault();
      if (this._snapDisabled) {
        this._contentRef.nativeElement.scrollBy(event.deltaY, 0);
      } else {
        if (event.deltaY < 0) {
          this.moveLeft();
        } else if (event.deltaY > 0) {
          this.moveRight();
        }
      }
    }
  }
  onWindowResize() {
    this.refreshWrapperDimensions();
    this.checkNavStatus();
  }
  _setIsDragging(value) {
    if (this._isDragging === value) {
      return;
    }
    this._isDragging = value;
    value ? this.dragStart.emit() : this.dragEnd.emit();
  }
  _startGlobalListening(isTouchEvent) {
    if (!this._onMouseMoveListener) {
      const eventName = isTouchEvent ? "touchmove" : "mousemove";
      this._onMouseMoveListener = this._renderer.listen("document", eventName, this.onMouseMoveHandler.bind(this));
    }
    if (!this._onMouseUpListener) {
      const eventName = isTouchEvent ? "touchend" : "mouseup";
      this._onMouseUpListener = this._renderer.listen("document", eventName, this.onMouseUpHandler.bind(this));
    }
  }
  _stopGlobalListening() {
    if (this._onMouseMoveListener) {
      this._onMouseMoveListener = this._onMouseMoveListener();
    }
    if (this._onMouseUpListener) {
      this._onMouseUpListener = this._onMouseUpListener();
    }
  }
  disableScroll(axis) {
    this._renderer.setStyle(this._contentRef.nativeElement, `overflow-${axis}`, "hidden");
  }
  enableScroll(axis) {
    this._renderer.setStyle(this._contentRef.nativeElement, `overflow-${axis}`, "auto");
  }
  hideScrollbar() {
    if (this._contentRef.nativeElement.style.display !== "none" && !this.wrapper) {
      this.parentNode = this._contentRef.nativeElement.parentNode;
      this.wrapper = this._renderer.createElement("div");
      this._renderer.setAttribute(this.wrapper, "class", "drag-scroll-wrapper");
      this._renderer.addClass(this.wrapper, "drag-scroll-container");
      this.refreshWrapperDimensions();
      this._renderer.setStyle(this.wrapper, "overflow", "hidden");
      this._renderer.setStyle(this._contentRef.nativeElement, "width", `calc(100% + ${this.scrollbarWidth})`);
      this._renderer.setStyle(this._contentRef.nativeElement, "height", `calc(100% + ${this.scrollbarWidth})`);
      this._renderer.appendChild(this._elementRef.nativeElement, this.wrapper);
      this._renderer.appendChild(this.wrapper, this._contentRef.nativeElement);
      this.adjustMarginToLastChild();
    }
  }
  showScrollbar() {
    if (this.wrapper) {
      this._renderer.setStyle(this._contentRef.nativeElement, "width", "100%");
      this._renderer.setStyle(this._contentRef.nativeElement, "height", this.wrapper.style.height);
      if (this.parentNode !== null) {
        this.parentNode.removeChild(this.wrapper);
        this.parentNode.appendChild(this._contentRef.nativeElement);
      }
      this.wrapper = null;
      this.adjustMarginToLastChild();
    }
  }
  checkScrollbar() {
    if (this._contentRef.nativeElement.scrollWidth <= this._contentRef.nativeElement.clientWidth) {
      this._renderer.setStyle(this._contentRef.nativeElement, "height", "100%");
    } else {
      this._renderer.setStyle(this._contentRef.nativeElement, "height", `calc(100% + ${this.scrollbarWidth})`);
    }
    if (this._contentRef.nativeElement.scrollHeight <= this._contentRef.nativeElement.clientHeight) {
      this._renderer.setStyle(this._contentRef.nativeElement, "width", "100%");
    } else {
      this._renderer.setStyle(this._contentRef.nativeElement, "width", `calc(100% + ${this.scrollbarWidth})`);
    }
  }
  setScrollBar() {
    if (this.scrollbarHidden) {
      this.hideScrollbar();
    } else {
      this.showScrollbar();
    }
  }
  getScrollbarWidth() {
    const outer = this._renderer.createElement("div");
    this._renderer.setStyle(outer, "visibility", "hidden");
    this._renderer.setStyle(outer, "width", "100px");
    this._renderer.setStyle(outer, "msOverflowStyle", "scrollbar");
    this._renderer.appendChild(this._document.body, outer);
    const widthNoScroll = outer.offsetWidth;
    this._renderer.setStyle(outer, "overflow", "scroll");
    const inner = this._renderer.createElement("div");
    this._renderer.setStyle(inner, "width", "100%");
    this._renderer.appendChild(outer, inner);
    const widthWithScroll = inner.offsetWidth;
    this._renderer.removeChild(this._document.body, outer);
    return widthNoScroll - widthWithScroll || 20;
  }
  refreshWrapperDimensions() {
    if (this.wrapper) {
      this._renderer.setStyle(this.wrapper, "width", "100%");
      if (this._elementRef.nativeElement.style.height > 0 || this._elementRef.nativeElement.offsetHeight > 0) {
        this._renderer.setStyle(this.wrapper, "height", this._elementRef.nativeElement.style.height || this._elementRef.nativeElement.offsetHeight + "px");
      } else {
        this._renderer.setStyle(this.wrapper, "height", "100%");
      }
    }
  }
  /*
   * The below solution is heavily inspired from
   * https://gist.github.com/andjosh/6764939
   */
  scrollTo(element, to, duration) {
    const self = this;
    self.isAnimating = true;
    const rtlFactor = this.rtl ? -1 : 1;
    const start = element.scrollLeft, change = rtlFactor * to - start - this.snapOffset, increment = 20;
    let currentTime = 0;
    const easeInOutQuad = function(t, b, c, d) {
      t /= d / 2;
      if (t < 1) {
        return c / 2 * t * t + b;
      }
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    };
    const animateScroll = function() {
      currentTime += increment;
      element.scrollLeft = easeInOutQuad(currentTime, start, change, duration);
      if (currentTime < duration) {
        self.scrollToTimer = setTimeout(animateScroll, increment);
      } else {
        setTimeout(() => {
          self.isAnimating = false;
          self.snapAnimationFinished.emit(self.currIndex);
        }, increment);
      }
    };
    animateScroll();
  }
  locateCurrentIndex(snap) {
    const scrollLeft = Math.abs(this._contentRef.nativeElement.scrollLeft);
    this.currentChildWidth((currentChildWidth, nextChildrenWidth, childrenWidth, idx, stop) => {
      if (scrollLeft >= childrenWidth && scrollLeft <= nextChildrenWidth) {
        if (nextChildrenWidth - scrollLeft > currentChildWidth / 2 && !this.isScrollReachesRightEnd()) {
          if (!this.isAnimating) {
            this.currIndex = idx;
          }
          if (snap) {
            this.scrollTo(this._contentRef.nativeElement, childrenWidth, this.snapDuration);
          }
        } else if (scrollLeft !== 0) {
          if (!this.isAnimating) {
            this.currIndex = idx + 1;
          }
          if (snap) {
            this.scrollTo(this._contentRef.nativeElement, childrenWidth + currentChildWidth, this.snapDuration);
          }
        }
        stop();
      } else if (idx + 1 === this._children.length - 1) {
        if (!this.isAnimating) {
          this.currIndex = idx + 1;
        }
        stop();
      }
    });
  }
  currentChildWidth(cb) {
    let childrenWidth = 0;
    let shouldBreak = false;
    const breakFunc = function() {
      shouldBreak = true;
    };
    const childrenArr = this._children.toArray();
    for (let i = 0; i < childrenArr.length; i++) {
      if (i === childrenArr.length - 1) {
        break;
      }
      if (shouldBreak) {
        break;
      }
      const nextChildrenWidth = childrenWidth + childrenArr[i + 1]._elementRef.nativeElement.clientWidth;
      const currentClildWidth = childrenArr[i]._elementRef.nativeElement.clientWidth;
      cb(currentClildWidth, nextChildrenWidth, childrenWidth, i, breakFunc);
      childrenWidth += currentClildWidth;
    }
  }
  toChildrenLocation() {
    let to = 0;
    const childrenArr = this._children.toArray();
    for (let i = 0; i < this.currIndex; i++) {
      to += childrenArr[i]._elementRef.nativeElement.clientWidth;
    }
    return to;
  }
  locateDragScrollItem(element) {
    let item = null;
    const childrenArr = this._children.toArray();
    for (let i = 0; i < childrenArr.length; i++) {
      if (element === childrenArr[i]._elementRef.nativeElement) {
        item = childrenArr[i];
      }
    }
    return item;
  }
  markElDimension() {
    if (this.wrapper) {
      this.elWidth = this.wrapper.style.width;
      this.elHeight = this.wrapper.style.height;
    } else {
      this.elWidth = this._elementRef.nativeElement.style.width || this._elementRef.nativeElement.offsetWidth + "px";
      this.elHeight = this._elementRef.nativeElement.style.height || this._elementRef.nativeElement.offsetHeight + "px";
    }
    const container = this.wrapper || this.parentNode;
    const containerWidth = container ? container.clientWidth : 0;
    if (this._children.length > 1) {
      this.indexBound = this.maximumIndex(containerWidth, this._children.toArray());
    }
  }
  maximumIndex(containerWidth, childrenElements) {
    let count = 0;
    let childrenWidth = 0;
    for (let i = 0; i <= childrenElements.length; i++) {
      const dragScrollItemDirective = childrenElements[childrenElements.length - 1 - i];
      if (!dragScrollItemDirective) {
        break;
      } else {
        const nativeElement = dragScrollItemDirective._elementRef.nativeElement;
        let itemWidth = nativeElement.clientWidth;
        if (itemWidth === 0 && nativeElement.firstElementChild) {
          itemWidth = dragScrollItemDirective._elementRef.nativeElement.firstElementChild.clientWidth;
        }
        childrenWidth += itemWidth;
        if (childrenWidth < containerWidth) {
          count++;
        } else {
          break;
        }
      }
    }
    return childrenElements.length - count;
  }
  isScrollReachesRightEnd() {
    const scrollLeftPos = Math.abs(this._contentRef.nativeElement.scrollLeft) + this._contentRef.nativeElement.offsetWidth;
    return scrollLeftPos >= this._contentRef.nativeElement.scrollWidth;
  }
  /**
   * adds a margin right style to the last child element which will resolve the issue
   * of last item gets cutoff.
   */
  adjustMarginToLastChild() {
    if (this._children && this._children.length > 0 && this.hideScrollbar) {
      const childrenArr = this._children.toArray();
      const lastItem = childrenArr[childrenArr.length - 1]._elementRef.nativeElement;
      if (this.wrapper && childrenArr.length > 1) {
        this._renderer.setStyle(lastItem, "margin-right", this.scrollbarWidth);
      } else {
        this._renderer.setStyle(lastItem, "margin-right", 0);
      }
    }
  }
  static {
    this.ɵfac = function DragScrollComponent_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _DragScrollComponent)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(DOCUMENT));
    };
  }
  static {
    this.ɵcmp = ɵɵdefineComponent({
      type: _DragScrollComponent,
      selectors: [["drag-scroll"]],
      contentQueries: function DragScrollComponent_ContentQueries(rf, ctx, dirIndex) {
        if (rf & 1) {
          ɵɵcontentQuery(dirIndex, DragScrollItemDirective, 5);
        }
        if (rf & 2) {
          let _t;
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._children = _t);
        }
      },
      viewQuery: function DragScrollComponent_Query(rf, ctx) {
        if (rf & 1) {
          ɵɵviewQuery(_c0, 7);
        }
        if (rf & 2) {
          let _t;
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._contentRef = _t.first);
        }
      },
      hostVars: 2,
      hostBindings: function DragScrollComponent_HostBindings(rf, ctx) {
        if (rf & 1) {
          ɵɵlistener("wheel", function DragScrollComponent_wheel_HostBindingHandler($event) {
            return ctx.onWheel($event);
          })("resize", function DragScrollComponent_resize_HostBindingHandler() {
            return ctx.onWindowResize();
          }, false, ɵɵresolveWindow);
        }
        if (rf & 2) {
          ɵɵstyleProp("pointer-events", ctx._pointerEvents);
        }
      },
      inputs: {
        scrollbarHidden: [0, "scrollbar-hidden", "scrollbarHidden"],
        disabled: [0, "drag-scroll-disabled", "disabled"],
        xDisabled: [0, "drag-scroll-x-disabled", "xDisabled"],
        yDisabled: [0, "drag-scroll-y-disabled", "yDisabled"],
        xWheelEnabled: [0, "scroll-x-wheel-enabled", "xWheelEnabled"],
        dragDisabled: [0, "drag-disabled", "dragDisabled"],
        snapDisabled: [0, "snap-disabled", "snapDisabled"],
        snapOffset: [0, "snap-offset", "snapOffset"],
        snapDuration: [0, "snap-duration", "snapDuration"]
      },
      outputs: {
        dsInitialized: "dsInitialized",
        indexChanged: "indexChanged",
        reachesLeftBound: "reachesLeftBound",
        reachesRightBound: "reachesRightBound",
        snapAnimationFinished: "snapAnimationFinished",
        dragStart: "dragStart",
        dragEnd: "dragEnd"
      },
      standalone: true,
      features: [ɵɵNgOnChangesFeature, ɵɵStandaloneFeature],
      ngContentSelectors: _c1,
      decls: 3,
      vars: 0,
      consts: [["contentRef", ""], [1, "drag-scroll-content"]],
      template: function DragScrollComponent_Template(rf, ctx) {
        if (rf & 1) {
          ɵɵprojectionDef();
          ɵɵelementStart(0, "div", 1, 0);
          ɵɵprojection(2);
          ɵɵelementEnd();
        }
      },
      styles: ["[_nghost-%COMP%]{overflow:hidden;display:block}.drag-scroll-content[_ngcontent-%COMP%]{height:100%;overflow:auto;white-space:nowrap}"],
      changeDetection: 0
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DragScrollComponent, [{
    type: Component,
    args: [{
      selector: "drag-scroll",
      template: `
    <div class="drag-scroll-content" #contentRef>
      <ng-content></ng-content>
    </div>
  `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      standalone: true,
      styles: [":host{overflow:hidden;display:block}.drag-scroll-content{height:100%;overflow:auto;white-space:nowrap}\n"]
    }]
  }], () => [{
    type: ElementRef,
    decorators: [{
      type: Inject,
      args: [ElementRef]
    }]
  }, {
    type: Renderer2,
    decorators: [{
      type: Inject,
      args: [Renderer2]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }], {
    _contentRef: [{
      type: ViewChild,
      args: ["contentRef", {
        static: true
      }]
    }],
    _children: [{
      type: ContentChildren,
      args: [DragScrollItemDirective, {
        descendants: true
      }]
    }],
    _pointerEvents: [{
      type: HostBinding,
      args: ["style.pointer-events"]
    }],
    dsInitialized: [{
      type: Output
    }],
    indexChanged: [{
      type: Output
    }],
    reachesLeftBound: [{
      type: Output
    }],
    reachesRightBound: [{
      type: Output
    }],
    snapAnimationFinished: [{
      type: Output
    }],
    dragStart: [{
      type: Output
    }],
    dragEnd: [{
      type: Output
    }],
    scrollbarHidden: [{
      type: Input,
      args: ["scrollbar-hidden"]
    }],
    disabled: [{
      type: Input,
      args: ["drag-scroll-disabled"]
    }],
    xDisabled: [{
      type: Input,
      args: ["drag-scroll-x-disabled"]
    }],
    yDisabled: [{
      type: Input,
      args: ["drag-scroll-y-disabled"]
    }],
    xWheelEnabled: [{
      type: Input,
      args: ["scroll-x-wheel-enabled"]
    }],
    dragDisabled: [{
      type: Input,
      args: ["drag-disabled"]
    }],
    snapDisabled: [{
      type: Input,
      args: ["snap-disabled"]
    }],
    snapOffset: [{
      type: Input,
      args: ["snap-offset"]
    }],
    snapDuration: [{
      type: Input,
      args: ["snap-duration"]
    }],
    onWheel: [{
      type: HostListener,
      args: ["wheel", ["$event"]]
    }],
    onWindowResize: [{
      type: HostListener,
      args: ["window:resize"]
    }]
  });
})();
export {
  DragScrollComponent,
  DragScrollItemDirective
};
//# sourceMappingURL=ngx-drag-scroll.js.map

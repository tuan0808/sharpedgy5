import { Component, ContentChild, ElementRef, EventEmitter, forwardRef, Input, Output, Renderer2, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/forms";
import * as i3 from "./highlight.pipe";
/**
 * Keyboard events
 */
const isArrowUp = keyCode => keyCode === 38;
const isArrowDown = keyCode => keyCode === 40;
const isArrowUpDown = keyCode => isArrowUp(keyCode) || isArrowDown(keyCode);
const isEnter = keyCode => keyCode === 13;
const isBackspace = keyCode => keyCode === 8;
const isDelete = keyCode => keyCode === 46;
const isESC = keyCode => keyCode === 27;
const isTab = keyCode => keyCode === 9;
export class AutocompleteComponent {
    constructor(elementRef, renderer) {
        this.renderer = renderer;
        this.query = ''; // search query
        this.filteredList = []; // list of items
        this.historyList = []; // list of history items
        this.isHistoryListVisible = true;
        this.selectedIdx = -1;
        this.toHighlight = '';
        this.notFound = false;
        this.isFocused = false;
        this.isOpen = false;
        this.isScrollToEnd = false;
        this.overlay = false;
        this.manualOpen = undefined;
        this.manualClose = undefined;
        // @Inputs
        /**
         * Data of items list.
         * It can be array of strings or array of objects.
         */
        this.data = [];
        this.placeholder = '';
        this.heading = '';
        /**
         * Heading text of history list.
         * If it is null then history heading is hidden.
         */
        this.historyHeading = 'Recently selected';
        this.historyListMaxNumber = 15; // maximum number of items in the history list.
        this.notFoundText = 'Not found'; // set custom text when filter returns empty result
        /**
         * The minimum number of characters the user must type before a search is performed.
         */
        this.minQueryLength = 1;
        /**
         * Focus first item in the list
         */
        this.focusFirst = false;
        // @Output events
        /** Event that is emitted whenever an item from the list is selected. */
        this.selected = new EventEmitter();
        /** Event that is emitted whenever an input is changed. */
        this.inputChanged = new EventEmitter();
        /** Event that is emitted whenever an input is focused. */
        this.inputFocused = new EventEmitter();
        /** Event that is emitted whenever an input is cleared. */
        this.inputCleared = new EventEmitter();
        /** Event that is emitted when the autocomplete panel is opened. */
        this.opened = new EventEmitter();
        /** Event that is emitted when the autocomplete panel is closed. */
        this.closed = new EventEmitter();
        /** Event that is emitted when scrolled to the end of items. */
        this.scrolledToEnd = new EventEmitter();
        /**
         * Propagates new value when model changes
         */
        this.propagateChange = () => {
        };
        this.onTouched = () => {
        };
        this.elementRef = elementRef;
    }
    /**
     * Writes a new value from the form model into the view,
     * Updates model
     */
    writeValue(value = '') {
        this.query = this.selectedValueRender !== undefined ? this.selectedValueRender(value) : this.defaultWriteValue(value);
    }
    defaultWriteValue(value) {
        return value && !this.isTypeString(value) ? value[this.searchKeyword] : value;
    }
    /**
     * Registers a handler that is called when something in the view has changed
     */
    registerOnChange(fn) {
        this.propagateChange = fn;
    }
    /**
     * Registers a handler specifically for when a control receives a touch event
     */
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    /**
     * Event that is called when the value of an input element is changed
     */
    onChange(event) {
        this.propagateChange(event.target.value);
    }
    /**
     * Event that is called when the control status changes to or from DISABLED
     */
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
    ngOnInit() {
    }
    ngAfterViewInit() {
        this.initEventStream();
        this.handleScroll();
    }
    /**
     * Set initial value
     * @param value
     */
    setInitialValue(value) {
        if (this.initialValue) {
            this.select(value);
        }
    }
    /**
     * Update search results
     */
    ngOnChanges(changes) {
        this.setInitialValue(this.initialValue);
        if (changes &&
            changes.data &&
            Array.isArray(changes.data.currentValue)) {
            this.handleItemsChange();
            if (!changes.data.firstChange && this.isFocused) {
                this.handleOpen();
            }
        }
    }
    /**
     * Items change
     */
    handleItemsChange() {
        this.isScrollToEnd = false;
        if (!this.isOpen) {
            return;
        }
        this.filteredList = this.data;
        this.notFound = !this.filteredList || this.filteredList.length === 0;
        // Filter list when updating data and panel is open
        if (this.isOpen) {
            this.filterList();
        }
    }
    /**
     * Filter data
     */
    filterList() {
        this.selectedIdx = -1;
        this.initSearchHistory();
        if (this.query != null && this.data) {
            this.toHighlight = this.query;
            this.filteredList = this.customFilter !== undefined ? this.customFilter([...this.data], this.query) : this.defaultFilterFunction();
            // If [focusFirst]="true" automatically focus the first match
            if (this.filteredList.length > 0 && this.focusFirst) {
                this.selectedIdx = 0;
            }
        }
        else {
            this.notFound = false;
        }
    }
    /**
     * Default filter function, used unless customFilter is provided
     */
    defaultFilterFunction() {
        return this.data.filter((item) => {
            if (typeof item === 'string') {
                // string logic, check equality of strings
                return item.toLowerCase().indexOf(this.query.toLowerCase()) > -1;
            }
            else if (typeof item === 'object' && item instanceof Object) {
                // object logic, check property equality
                return item[this.searchKeyword] ? item[this.searchKeyword].toLowerCase().indexOf(this.query.toLowerCase()) > -1 : "";
            }
        });
    }
    /**
     * Check if item is a string in the list.
     * @param item
     */
    isTypeString(item) {
        return typeof item === 'string';
    }
    /**
     * Select item in the list.
     * @param item
     */
    select(item) {
        this.query = !this.isTypeString(item) ? item[this.searchKeyword] : item;
        this.isOpen = true;
        this.overlay = false;
        this.selected.emit(item);
        this.propagateChange(item);
        if (this.initialValue) {
            // check if history already exists in localStorage and then update
            const history = window.localStorage.getItem(`${this.historyIdentifier}`);
            if (history) {
                let existingHistory = JSON.parse(localStorage[`${this.historyIdentifier}`]);
                if (!(existingHistory instanceof Array))
                    existingHistory = [];
                // check if selected item exists in existingHistory
                if (!existingHistory.some((existingItem) => !this.isTypeString(existingItem)
                    ? existingItem[this.searchKeyword] == item[this.searchKeyword] : existingItem == item)) {
                    existingHistory.unshift(item);
                    localStorage.setItem(`${this.historyIdentifier}`, JSON.stringify(existingHistory));
                    // check if items don't exceed max allowed number
                    if (existingHistory.length >= this.historyListMaxNumber) {
                        existingHistory.splice(existingHistory.length - 1, 1);
                        localStorage.setItem(`${this.historyIdentifier}`, JSON.stringify(existingHistory));
                    }
                }
                else {
                    // if selected item exists in existingHistory swap to top in array
                    if (!this.isTypeString(item)) {
                        // object logic
                        const copiedExistingHistory = existingHistory.slice(); // copy original existingHistory array
                        const selectedIndex = copiedExistingHistory.map((el) => el[this.searchKeyword]).indexOf(item[this.searchKeyword]);
                        copiedExistingHistory.splice(selectedIndex, 1);
                        copiedExistingHistory.splice(0, 0, item);
                        localStorage.setItem(`${this.historyIdentifier}`, JSON.stringify(copiedExistingHistory));
                    }
                    else {
                        // string logic
                        const copiedExistingHistory = existingHistory.slice(); // copy original existingHistory array
                        copiedExistingHistory.splice(copiedExistingHistory.indexOf(item), 1);
                        copiedExistingHistory.splice(0, 0, item);
                        localStorage.setItem(`${this.historyIdentifier}`, JSON.stringify(copiedExistingHistory));
                    }
                }
            }
            else {
                this.saveHistory(item);
            }
        }
        else {
            this.saveHistory(item);
        }
        this.handleClose();
    }
    /**
     * Document click
     * @param e event
     */
    handleClick(e) {
        let clickedComponent = e.target;
        let inside = false;
        do {
            if (clickedComponent === this.elementRef.nativeElement) {
                inside = true;
                if (this.filteredList.length) {
                    this.handleOpen();
                }
            }
            clickedComponent = clickedComponent.parentNode;
        } while (clickedComponent);
        if (!inside) {
            this.handleClose();
        }
    }
    /**
     * Handle body overlay
     */
    handleOverlay() {
        this.overlay = false;
    }
    /**
     * Scroll items
     */
    handleScroll() {
        this.renderer.listen(this.filteredListElement.nativeElement, 'scroll', () => {
            this.scrollToEnd();
        });
    }
    /**
     * Define panel state
     */
    setPanelState(event) {
        if (event) {
            event.stopPropagation();
        }
        // If controls are untouched
        if (typeof this.manualOpen === 'undefined'
            && typeof this.manualClose === 'undefined') {
            this.isOpen = false;
            this.handleOpen();
        }
        // If one of the controls is untouched and other is deactivated
        if (typeof this.manualOpen === 'undefined'
            && this.manualClose === false
            || typeof this.manualClose === 'undefined'
                && this.manualOpen === false) {
            this.isOpen = false;
            this.handleOpen();
        }
        // if controls are touched but both are deactivated
        if (this.manualOpen === false && this.manualClose === false) {
            this.isOpen = false;
            this.handleOpen();
        }
        // if open control is touched and activated
        if (this.manualOpen) {
            this.isOpen = false;
            this.handleOpen();
            this.manualOpen = false;
        }
        // if close control is touched and activated
        if (this.manualClose) {
            this.isOpen = true;
            this.handleClose();
            this.manualClose = false;
        }
    }
    /**
     * Manual controls
     */
    open() {
        this.manualOpen = true;
        this.isOpen = false;
        this.handleOpen();
    }
    close() {
        this.manualClose = true;
        this.isOpen = true;
        this.handleClose();
    }
    focus() {
        this.handleFocus(event);
    }
    clear() {
        this.remove(event);
    }
    /**
     * Remove search query
     */
    remove(e) {
        e.stopPropagation();
        this.query = '';
        this.inputCleared.emit();
        this.propagateChange(this.query);
        this.setPanelState(e);
        if (this.data && !this.data.length) {
            this.notFound = false;
        }
    }
    /**
     * Initialize historyList search
     */
    initSearchHistory() {
        this.isHistoryListVisible = false;
        if (this.historyIdentifier && !this.query) {
            const history = window.localStorage.getItem(`${this.historyIdentifier}`);
            if (history) {
                this.isHistoryListVisible = true;
                this.filteredList = [];
                this.historyList = history ? JSON.parse(history) : [];
            }
            else {
                this.isHistoryListVisible = false;
            }
        }
        else {
            this.isHistoryListVisible = false;
        }
    }
    handleOpen() {
        if (this.isOpen || this.isOpen && !this.isLoading) {
            return;
        }
        // If data exists
        if (this.data && this.data.length) {
            this.isOpen = true;
            this.overlay = true;
            this.filterList();
            this.opened.emit();
        }
    }
    handleClose() {
        if (!this.isOpen) {
            this.isFocused = false;
            return;
        }
        this.isOpen = false;
        this.overlay = false;
        this.filteredList = [];
        this.selectedIdx = -1;
        this.notFound = false;
        this.isHistoryListVisible = false;
        this.isFocused = false;
        this.closed.emit();
    }
    handleFocus(e) {
        this.searchInput.nativeElement.focus();
        if (this.isFocused) {
            return;
        }
        this.inputFocused.emit(e);
        // if data exists then open
        if (this.data && this.data.length) {
            this.setPanelState(e);
        }
        this.isFocused = true;
    }
    scrollToEnd() {
        if (this.isScrollToEnd) {
            return;
        }
        const scrollTop = this.filteredListElement.nativeElement
            .scrollTop;
        const scrollHeight = this.filteredListElement.nativeElement
            .scrollHeight;
        const elementHeight = this.filteredListElement.nativeElement
            .clientHeight;
        const atBottom = elementHeight != 0 && Math.abs(scrollHeight - elementHeight - scrollTop) < 1;
        if (atBottom) {
            this.scrolledToEnd.emit();
            this.isScrollToEnd = true;
        }
    }
    /**
     * Initialize keyboard events
     */
    initEventStream() {
        this.inputKeyUp$ = fromEvent(this.searchInput.nativeElement, 'keyup').pipe(map((e) => e));
        this.inputKeyDown$ = fromEvent(this.searchInput.nativeElement, 'keydown').pipe(map((e) => e));
        this.listenEventStream();
    }
    /**
     * Listen keyboard events
     */
    listenEventStream() {
        // key up event
        this.inputKeyUp$
            .pipe(filter(e => !isArrowUpDown(e.keyCode) &&
            !isEnter(e.keyCode) &&
            !isESC(e.keyCode) &&
            !isTab(e.keyCode)), debounceTime(this.debounceTime)).subscribe(e => {
            this.onKeyUp(e);
        });
        // cursor up & down
        this.inputKeyDown$.pipe(filter(e => isArrowUpDown(e.keyCode))).subscribe(e => {
            e.preventDefault();
            this.onFocusItem(e);
        });
        // enter keyup
        this.inputKeyUp$.pipe(filter(e => isEnter(e.keyCode))).subscribe(e => {
            //this.onHandleEnter();
        });
        // enter keydown
        this.inputKeyDown$.pipe(filter(e => isEnter(e.keyCode))).subscribe(e => {
            this.onHandleEnter();
        });
        // ESC
        this.inputKeyUp$.pipe(filter(e => isESC(e.keyCode), debounceTime(100))).subscribe(e => {
            this.onEsc();
        });
        // TAB
        this.inputKeyDown$.pipe(filter(e => isTab(e.keyCode))).subscribe(e => {
            this.onTab();
        });
        // delete
        this.inputKeyDown$.pipe(filter(e => isBackspace(e.keyCode) || isDelete(e.keyCode))).subscribe(e => {
            this.onDelete();
        });
    }
    /**
     * on keyup == when input changed
     * @param e event
     */
    onKeyUp(e) {
        this.notFound = false; // search results are unknown while typing
        // if input is empty
        if (!this.query) {
            this.notFound = false;
            this.inputChanged.emit(e.target.value);
            this.inputCleared.emit();
            this.setPanelState(e);
        }
        // note that '' can be a valid query
        if (!this.query && this.query !== '') {
            return;
        }
        // if query >= to minQueryLength
        if (this.query.length >= this.minQueryLength) {
            this.inputChanged.emit(e.target.value);
            this.filterList();
            // If no results found
            if (!this.filteredList.length && !this.isLoading) {
                this.notFoundText ? this.notFound = true : this.notFound = false;
            }
            if (this.data && !this.data.length) {
                this.isOpen = true;
            }
        }
    }
    /**
     * Keyboard arrow top and arrow bottom
     * @param e event
     */
    onFocusItem(e) {
        // move arrow up and down on filteredList or historyList
        if (!this.historyList.length || !this.isHistoryListVisible) {
            // filteredList
            const totalNumItem = this.filteredList.length;
            if (e.key === 'ArrowDown') {
                let sum = this.selectedIdx;
                sum = (this.selectedIdx === null) ? 0 : sum + 1;
                this.selectedIdx = (totalNumItem + sum) % totalNumItem;
                this.scrollToFocusedItem(this.selectedIdx);
            }
            else if (e.key === 'ArrowUp') {
                if (this.selectedIdx == -1) {
                    this.selectedIdx = 0;
                }
                this.selectedIdx = (totalNumItem + this.selectedIdx - 1) % totalNumItem;
                this.scrollToFocusedItem(this.selectedIdx);
            }
        }
        else {
            // historyList
            const totalNumItem = this.historyList.length;
            if (e.key === 'ArrowDown') {
                let sum = this.selectedIdx;
                sum = (this.selectedIdx === null) ? 0 : sum + 1;
                this.selectedIdx = (totalNumItem + sum) % totalNumItem;
                this.scrollToFocusedItem(this.selectedIdx);
            }
            else if (e.key === 'ArrowUp') {
                if (this.selectedIdx == -1) {
                    this.selectedIdx = 0;
                }
                this.selectedIdx = (totalNumItem + this.selectedIdx - 1) % totalNumItem;
                this.scrollToFocusedItem(this.selectedIdx);
            }
        }
    }
    /**
     * Scroll to focused item
     * * @param index
     */
    scrollToFocusedItem(index) {
        let listElement = null;
        // Define list element
        if (!this.historyList.length || !this.isHistoryListVisible) {
            // filteredList element
            listElement = this.filteredListElement.nativeElement;
        }
        else {
            // historyList element
            listElement = this.historyListElement.nativeElement;
        }
        const items = Array.prototype.slice.call(listElement.childNodes).filter((node) => {
            if (node.nodeType === 1) {
                // if node is element
                return node.className.includes('item');
            }
            else {
                return false;
            }
        });
        if (!items.length) {
            return;
        }
        const listHeight = listElement.offsetHeight;
        const itemHeight = items[index].offsetHeight;
        const visibleTop = listElement.scrollTop;
        const visibleBottom = listElement.scrollTop + listHeight - itemHeight;
        const targetPosition = items[index].offsetTop;
        if (targetPosition < visibleTop) {
            listElement.scrollTop = targetPosition;
        }
        if (targetPosition > visibleBottom) {
            listElement.scrollTop = targetPosition - listHeight + itemHeight;
        }
    }
    /**
     * Select item on enter click
     */
    onHandleEnter() {
        // click enter to choose item from filteredList or historyList
        if (this.selectedIdx > -1) {
            if (!this.historyList.length || !this.isHistoryListVisible) {
                // filteredList
                this.query = !this.isTypeString(this.filteredList[this.selectedIdx])
                    ? this.filteredList[this.selectedIdx][this.searchKeyword]
                    : this.filteredList[this.selectedIdx];
                this.saveHistory(this.filteredList[this.selectedIdx]);
                this.select(this.filteredList[this.selectedIdx]);
            }
            else {
                // historyList
                this.query = !this.isTypeString(this.historyList[this.selectedIdx])
                    ? this.historyList[this.selectedIdx][this.searchKeyword]
                    : this.historyList[this.selectedIdx];
                this.saveHistory(this.historyList[this.selectedIdx]);
                this.select(this.historyList[this.selectedIdx]);
            }
        }
        this.isHistoryListVisible = false;
        this.handleClose();
    }
    /**
     * Esc click
     */
    onEsc() {
        this.searchInput.nativeElement.blur();
        this.handleClose();
    }
    /**
     * Tab click
     */
    onTab() {
        this.searchInput.nativeElement.blur();
        this.handleClose();
    }
    /**
     * Delete click
     */
    onDelete() {
        this.isOpen = true;
    }
    /**
     * Select item to save in localStorage
     * @param selected
     */
    saveHistory(selected) {
        if (this.historyIdentifier) {
            // check if selected item exists in historyList
            if (!this.historyList.some((item) => !this.isTypeString(item)
                ? item[this.searchKeyword] == selected[this.searchKeyword] : item == selected)) {
                this.saveHistoryToLocalStorage([selected, ...this.historyList]);
                // check if items don't exceed max allowed number
                if (this.historyList.length >= this.historyListMaxNumber) {
                    this.historyList.splice(this.historyList.length - 1, 1);
                    this.saveHistoryToLocalStorage([selected, ...this.historyList]);
                }
            }
            else {
                // if selected item exists in historyList swap to top in array
                if (!this.isTypeString(selected)) {
                    // object logic
                    const copiedHistoryList = this.historyList.slice(); // copy original historyList array
                    const selectedIndex = copiedHistoryList.map((item) => item[this.searchKeyword]).indexOf(selected[this.searchKeyword]);
                    copiedHistoryList.splice(selectedIndex, 1);
                    copiedHistoryList.splice(0, 0, selected);
                    this.saveHistoryToLocalStorage([...copiedHistoryList]);
                }
                else {
                    // string logic
                    const copiedHistoryList = this.historyList.slice(); // copy original historyList array
                    copiedHistoryList.splice(this.historyList.indexOf(selected), 1);
                    copiedHistoryList.splice(0, 0, selected);
                    this.saveHistoryToLocalStorage([...copiedHistoryList]);
                }
            }
        }
    }
    /**
     * Save item in localStorage
     * @param selected
     */
    saveHistoryToLocalStorage(selected) {
        window.localStorage.setItem(`${this.historyIdentifier}`, JSON.stringify(selected));
    }
    /**
     * Remove item from localStorage
     * @param index
     * @param e event
     */
    removeHistoryItem(index, e) {
        e.stopPropagation();
        this.historyList = this.historyList.filter((v, i) => i !== index);
        this.saveHistoryToLocalStorage(this.historyList);
        if (this.historyList.length == 0) {
            window.localStorage.removeItem(`${this.historyIdentifier}`);
            this.filterList();
        }
    }
    /**
     * Reset localStorage
     * @param e event
     */
    resetHistoryList(e) {
        e.stopPropagation();
        this.historyList = [];
        window.localStorage.removeItem(`${this.historyIdentifier}`);
        this.filterList();
    }
}
AutocompleteComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.2.1", ngImport: i0, type: AutocompleteComponent, deps: [{ token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Component });
AutocompleteComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.2.1", type: AutocompleteComponent, selector: "ng-autocomplete", inputs: { data: "data", searchKeyword: "searchKeyword", placeholder: "placeholder", heading: "heading", initialValue: "initialValue", historyIdentifier: "historyIdentifier", historyHeading: "historyHeading", historyListMaxNumber: "historyListMaxNumber", notFoundText: "notFoundText", isLoading: "isLoading", debounceTime: "debounceTime", disabled: "disabled", minQueryLength: "minQueryLength", focusFirst: "focusFirst", customFilter: "customFilter", selectedValueRender: "selectedValueRender", itemTemplate: "itemTemplate", notFoundTemplate: "notFoundTemplate" }, outputs: { selected: "selected", inputChanged: "inputChanged", inputFocused: "inputFocused", inputCleared: "inputCleared", opened: "opened", closed: "closed", scrolledToEnd: "scrolledToEnd" }, host: { listeners: { "document:click": "handleClick($event)" }, classAttribute: "ng-autocomplete" }, providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AutocompleteComponent),
            multi: true
        }
    ], queries: [{ propertyName: "customTemplate", first: true, predicate: TemplateRef, descendants: true }], viewQueries: [{ propertyName: "searchInput", first: true, predicate: ["searchInput"], descendants: true }, { propertyName: "filteredListElement", first: true, predicate: ["filteredListElement"], descendants: true }, { propertyName: "historyListElement", first: true, predicate: ["historyListElement"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"autocomplete-container\" aria-owns=\"suggestions suggestions-history\" [attr.aria-expanded]=\"isOpen\"\n     [ngClass]=\"{ 'active': isOpen}\">\n  <div class=\"input-container\">\n    <input #searchInput\n           type=\"text\"\n           attr.aria-label=\"{{placeholder}}\"\n           aria-autocomplete=\"list\"\n           role=\"combobox\"\n           placeholder={{placeholder}}\n           [(ngModel)]=query\n           (input)=\"onChange($event)\"\n           (focus)=handleFocus($event)\n           (blur)=onTouched($event)\n           [disabled]=\"disabled\"\n           autocomplete=\"off\">\n    <div class=\"x\" *ngIf=\"query && !isLoading && !disabled\" (click)=\"remove($event)\">\n      <i class=\"material-icons\" aria-label=\"Close\">close</i>\n    </div>\n    <!--Loading mask-->\n    <div class=\"sk-fading-circle\" *ngIf=\"isLoading\">\n      <div class=\"sk-circle1 sk-circle\"></div>\n      <div class=\"sk-circle2 sk-circle\"></div>\n      <div class=\"sk-circle3 sk-circle\"></div>\n      <div class=\"sk-circle4 sk-circle\"></div>\n      <div class=\"sk-circle5 sk-circle\"></div>\n      <div class=\"sk-circle6 sk-circle\"></div>\n      <div class=\"sk-circle7 sk-circle\"></div>\n      <div class=\"sk-circle8 sk-circle\"></div>\n      <div class=\"sk-circle9 sk-circle\"></div>\n      <div class=\"sk-circle10 sk-circle\"></div>\n      <div class=\"sk-circle11 sk-circle\"></div>\n      <div class=\"sk-circle12 sk-circle\"></div>\n    </div>\n  </div>\n\n  <!--FilteredList items-->\n  <div class=\"suggestions-container\" id=\"suggestions\" role=\"listbox\"\n       [ngClass]=\"{ 'is-hidden': isHistoryListVisible, 'is-visible': !isHistoryListVisible}\">\n    <!--FilteredList heading-->\n    <div class=\"heading\" *ngIf=\"filteredList.length > 0 && heading\">\n      <div class=\"text\">{{heading}}</div>\n    </div>\n\n    <ul #filteredListElement>\n      <li *ngFor=\"let item of filteredList; let idx = index\" class=\"item\">\n        <!--string logic-->\n        <div [class.complete-selected]=\"idx === selectedIdx\" *ngIf='isTypeString(item)'\n             (click)=\"select(item)\">\n          <ng-container\n            *ngTemplateOutlet=\"itemTemplate;  context: { $implicit: item | highlight: toHighlight }\">\n          </ng-container>\n        </div>\n        <!--object logic-->\n        <div [class.complete-selected]=\"idx === selectedIdx\" *ngIf='!isTypeString(item)'\n             (click)=\"select(item)\">\n          <ng-container\n            *ngTemplateOutlet=\"itemTemplate; context: { $implicit: item | highlight: toHighlight : searchKeyword }\">\n          </ng-container>\n        </div>\n      </li>\n    </ul>\n  </div>\n\n  <!--HistoryList items-->\n  <div class=\"suggestions-container\" id=\"suggestions-history\" role=\"listbox\"\n       [ngClass]=\"{ 'is-hidden': !isHistoryListVisible, 'is-visible': isHistoryListVisible}\">\n    <!--HistoryList heading-->\n    <div class=\"heading\" *ngIf=\"historyList.length > 0 && historyHeading\">\n      <div class=\"text\">{{historyHeading}}</div>\n      <div class=\"x\" (click)=\"resetHistoryList($event)\">\n        <i class=\"material-icons\" aria-label=\"Delete\">delete</i>\n      </div>\n    </div>\n\n    <ul #historyListElement>\n      <li *ngFor=\"let item of historyList; let idx = index\" class=\"item\">\n        <!--string logic-->\n        <div [class.complete-selected]=\"idx === selectedIdx\" *ngIf='isTypeString(item)' (click)=\"select(item)\">\n          <ng-container\n            *ngTemplateOutlet=\"itemTemplate;  context: { $implicit: item }\">\n          </ng-container>\n        </div>\n        <!--object logic-->\n        <div [class.complete-selected]=\"idx === selectedIdx\" *ngIf='!isTypeString(item)' (click)=\"select(item)\">\n          <ng-container\n            *ngTemplateOutlet=\"itemTemplate; context: { $implicit: item }\">\n          </ng-container>\n        </div>\n        <div class=\"x\" (click)=\"removeHistoryItem(idx, $event)\">\n          <i class=\"material-icons\" aria-label=\"Close\">close</i>\n        </div>\n      </li>\n    </ul>\n  </div>\n\n  <!--Not found-->\n  <div class=\"not-found\" *ngIf=\"isLoading ? !isLoading && notFound : notFound\">\n    <ng-container\n      *ngTemplateOutlet=\"notFoundTemplate;  context: { $implicit: notFoundText  }\">\n    </ng-container>\n  </div>\n</div>\n<div class=\"autocomplete-overlay\" *ngIf=\"overlay\" (click)=\"handleOverlay()\"></div>\n", styles: ["@import\"https://fonts.googleapis.com/icon?family=Material+Icons\";.ng-autocomplete{width:600px}.autocomplete-container{box-shadow:0 1px 3px #0003,0 1px 1px #00000024,0 2px 1px -1px #0000001f;position:relative;overflow:visible;height:40px}.autocomplete-container .input-container input{font-size:14px;box-sizing:border-box;border:none;box-shadow:none;outline:none;background-color:#fff;color:#000000de;width:100%;padding:0 15px;line-height:40px;height:40px}.autocomplete-container .input-container input:disabled{background-color:#eee;color:#666}.autocomplete-container .input-container .x{position:absolute;right:10px;margin:auto;cursor:pointer;top:50%;transform:translateY(-50%)}.autocomplete-container .input-container .x i{color:#0000008a;font-size:22px;vertical-align:middle}.autocomplete-container .suggestions-container{position:absolute;width:100%;background:white;height:auto;box-shadow:0 2px 5px #00000040;box-sizing:border-box}.autocomplete-container .suggestions-container ul{padding:0;margin:0;max-height:240px;overflow-y:auto}.autocomplete-container .suggestions-container ul li{position:relative;list-style:none;padding:0;margin:0;cursor:pointer}.autocomplete-container .suggestions-container ul li a{padding:14px 15px;display:block;text-decoration:none;color:#333;cursor:pointer;color:#000000de;font-size:15px}.autocomplete-container .suggestions-container ul li:hover,.autocomplete-container .suggestions-container .complete-selected{background-color:#9e9e9e2e}.autocomplete-container .suggestions-container .heading{position:relative;padding:10px 15px;border:solid 1px #f1f1f1}.autocomplete-container .suggestions-container .heading .text{font-size:.85em}.autocomplete-container .suggestions-container .x{position:absolute;right:10px;margin:auto;cursor:pointer;top:50%;transform:translateY(-50%)}.autocomplete-container .suggestions-container .x i{color:#0000008a;font-size:18px;vertical-align:middle}.autocomplete-container .suggestions-container.is-hidden{visibility:hidden}.autocomplete-container .suggestions-container.is-visible{visibility:visible}.autocomplete-container .not-found{padding:0 .75em;border:solid 1px #f1f1f1;background:white}.autocomplete-container .not-found div{padding:.4em 0;font-size:.95em;line-height:1.4;border-bottom:1px solid rgba(230,230,230,.7)}.autocomplete-container.active{z-index:999}.highlight{font-weight:700}.autocomplete-overlay{position:fixed;background-color:transparent;width:100%;height:100%;top:0;right:0;bottom:0;left:0;z-index:50}input[type=text]::-ms-clear{display:none}.sk-fading-circle{width:20px;height:20px;position:absolute;right:10px;top:0;bottom:0;margin:auto}.sk-fading-circle .sk-circle{width:100%;height:100%;position:absolute;left:0;top:0}.sk-fading-circle .sk-circle:before{content:\"\";display:block;margin:0 auto;width:15%;height:15%;background-color:#333;border-radius:100%;animation:sk-circleFadeDelay 1.2s infinite ease-in-out both}.sk-fading-circle .sk-circle2{transform:rotate(30deg)}.sk-fading-circle .sk-circle3{transform:rotate(60deg)}.sk-fading-circle .sk-circle4{transform:rotate(90deg)}.sk-fading-circle .sk-circle5{transform:rotate(120deg)}.sk-fading-circle .sk-circle6{transform:rotate(150deg)}.sk-fading-circle .sk-circle7{transform:rotate(180deg)}.sk-fading-circle .sk-circle8{transform:rotate(210deg)}.sk-fading-circle .sk-circle9{transform:rotate(240deg)}.sk-fading-circle .sk-circle10{transform:rotate(270deg)}.sk-fading-circle .sk-circle11{transform:rotate(300deg)}.sk-fading-circle .sk-circle12{transform:rotate(330deg)}.sk-fading-circle .sk-circle2:before{animation-delay:-1.1s}.sk-fading-circle .sk-circle3:before{animation-delay:-1s}.sk-fading-circle .sk-circle4:before{animation-delay:-.9s}.sk-fading-circle .sk-circle5:before{animation-delay:-.8s}.sk-fading-circle .sk-circle6:before{animation-delay:-.7s}.sk-fading-circle .sk-circle7:before{animation-delay:-.6s}.sk-fading-circle .sk-circle8:before{animation-delay:-.5s}.sk-fading-circle .sk-circle9:before{animation-delay:-.4s}.sk-fading-circle .sk-circle10:before{animation-delay:-.3s}.sk-fading-circle .sk-circle11:before{animation-delay:-.2s}.sk-fading-circle .sk-circle12:before{animation-delay:-.1s}@keyframes sk-circleFadeDelay{0%,39%,to{opacity:0}40%{opacity:1}}\n"], directives: [{ type: i1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { type: i2.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { type: i2.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i2.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { type: i1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], pipes: { "highlight": i3.HighlightPipe }, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.2.1", ngImport: i0, type: AutocompleteComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ng-autocomplete', providers: [
                        {
                            provide: NG_VALUE_ACCESSOR,
                            useExisting: forwardRef(() => AutocompleteComponent),
                            multi: true
                        }
                    ], encapsulation: ViewEncapsulation.None, host: {
                        '(document:click)': 'handleClick($event)',
                        'class': 'ng-autocomplete'
                    }, template: "<div class=\"autocomplete-container\" aria-owns=\"suggestions suggestions-history\" [attr.aria-expanded]=\"isOpen\"\n     [ngClass]=\"{ 'active': isOpen}\">\n  <div class=\"input-container\">\n    <input #searchInput\n           type=\"text\"\n           attr.aria-label=\"{{placeholder}}\"\n           aria-autocomplete=\"list\"\n           role=\"combobox\"\n           placeholder={{placeholder}}\n           [(ngModel)]=query\n           (input)=\"onChange($event)\"\n           (focus)=handleFocus($event)\n           (blur)=onTouched($event)\n           [disabled]=\"disabled\"\n           autocomplete=\"off\">\n    <div class=\"x\" *ngIf=\"query && !isLoading && !disabled\" (click)=\"remove($event)\">\n      <i class=\"material-icons\" aria-label=\"Close\">close</i>\n    </div>\n    <!--Loading mask-->\n    <div class=\"sk-fading-circle\" *ngIf=\"isLoading\">\n      <div class=\"sk-circle1 sk-circle\"></div>\n      <div class=\"sk-circle2 sk-circle\"></div>\n      <div class=\"sk-circle3 sk-circle\"></div>\n      <div class=\"sk-circle4 sk-circle\"></div>\n      <div class=\"sk-circle5 sk-circle\"></div>\n      <div class=\"sk-circle6 sk-circle\"></div>\n      <div class=\"sk-circle7 sk-circle\"></div>\n      <div class=\"sk-circle8 sk-circle\"></div>\n      <div class=\"sk-circle9 sk-circle\"></div>\n      <div class=\"sk-circle10 sk-circle\"></div>\n      <div class=\"sk-circle11 sk-circle\"></div>\n      <div class=\"sk-circle12 sk-circle\"></div>\n    </div>\n  </div>\n\n  <!--FilteredList items-->\n  <div class=\"suggestions-container\" id=\"suggestions\" role=\"listbox\"\n       [ngClass]=\"{ 'is-hidden': isHistoryListVisible, 'is-visible': !isHistoryListVisible}\">\n    <!--FilteredList heading-->\n    <div class=\"heading\" *ngIf=\"filteredList.length > 0 && heading\">\n      <div class=\"text\">{{heading}}</div>\n    </div>\n\n    <ul #filteredListElement>\n      <li *ngFor=\"let item of filteredList; let idx = index\" class=\"item\">\n        <!--string logic-->\n        <div [class.complete-selected]=\"idx === selectedIdx\" *ngIf='isTypeString(item)'\n             (click)=\"select(item)\">\n          <ng-container\n            *ngTemplateOutlet=\"itemTemplate;  context: { $implicit: item | highlight: toHighlight }\">\n          </ng-container>\n        </div>\n        <!--object logic-->\n        <div [class.complete-selected]=\"idx === selectedIdx\" *ngIf='!isTypeString(item)'\n             (click)=\"select(item)\">\n          <ng-container\n            *ngTemplateOutlet=\"itemTemplate; context: { $implicit: item | highlight: toHighlight : searchKeyword }\">\n          </ng-container>\n        </div>\n      </li>\n    </ul>\n  </div>\n\n  <!--HistoryList items-->\n  <div class=\"suggestions-container\" id=\"suggestions-history\" role=\"listbox\"\n       [ngClass]=\"{ 'is-hidden': !isHistoryListVisible, 'is-visible': isHistoryListVisible}\">\n    <!--HistoryList heading-->\n    <div class=\"heading\" *ngIf=\"historyList.length > 0 && historyHeading\">\n      <div class=\"text\">{{historyHeading}}</div>\n      <div class=\"x\" (click)=\"resetHistoryList($event)\">\n        <i class=\"material-icons\" aria-label=\"Delete\">delete</i>\n      </div>\n    </div>\n\n    <ul #historyListElement>\n      <li *ngFor=\"let item of historyList; let idx = index\" class=\"item\">\n        <!--string logic-->\n        <div [class.complete-selected]=\"idx === selectedIdx\" *ngIf='isTypeString(item)' (click)=\"select(item)\">\n          <ng-container\n            *ngTemplateOutlet=\"itemTemplate;  context: { $implicit: item }\">\n          </ng-container>\n        </div>\n        <!--object logic-->\n        <div [class.complete-selected]=\"idx === selectedIdx\" *ngIf='!isTypeString(item)' (click)=\"select(item)\">\n          <ng-container\n            *ngTemplateOutlet=\"itemTemplate; context: { $implicit: item }\">\n          </ng-container>\n        </div>\n        <div class=\"x\" (click)=\"removeHistoryItem(idx, $event)\">\n          <i class=\"material-icons\" aria-label=\"Close\">close</i>\n        </div>\n      </li>\n    </ul>\n  </div>\n\n  <!--Not found-->\n  <div class=\"not-found\" *ngIf=\"isLoading ? !isLoading && notFound : notFound\">\n    <ng-container\n      *ngTemplateOutlet=\"notFoundTemplate;  context: { $implicit: notFoundText  }\">\n    </ng-container>\n  </div>\n</div>\n<div class=\"autocomplete-overlay\" *ngIf=\"overlay\" (click)=\"handleOverlay()\"></div>\n", styles: ["@import\"https://fonts.googleapis.com/icon?family=Material+Icons\";.ng-autocomplete{width:600px}.autocomplete-container{box-shadow:0 1px 3px #0003,0 1px 1px #00000024,0 2px 1px -1px #0000001f;position:relative;overflow:visible;height:40px}.autocomplete-container .input-container input{font-size:14px;box-sizing:border-box;border:none;box-shadow:none;outline:none;background-color:#fff;color:#000000de;width:100%;padding:0 15px;line-height:40px;height:40px}.autocomplete-container .input-container input:disabled{background-color:#eee;color:#666}.autocomplete-container .input-container .x{position:absolute;right:10px;margin:auto;cursor:pointer;top:50%;transform:translateY(-50%)}.autocomplete-container .input-container .x i{color:#0000008a;font-size:22px;vertical-align:middle}.autocomplete-container .suggestions-container{position:absolute;width:100%;background:white;height:auto;box-shadow:0 2px 5px #00000040;box-sizing:border-box}.autocomplete-container .suggestions-container ul{padding:0;margin:0;max-height:240px;overflow-y:auto}.autocomplete-container .suggestions-container ul li{position:relative;list-style:none;padding:0;margin:0;cursor:pointer}.autocomplete-container .suggestions-container ul li a{padding:14px 15px;display:block;text-decoration:none;color:#333;cursor:pointer;color:#000000de;font-size:15px}.autocomplete-container .suggestions-container ul li:hover,.autocomplete-container .suggestions-container .complete-selected{background-color:#9e9e9e2e}.autocomplete-container .suggestions-container .heading{position:relative;padding:10px 15px;border:solid 1px #f1f1f1}.autocomplete-container .suggestions-container .heading .text{font-size:.85em}.autocomplete-container .suggestions-container .x{position:absolute;right:10px;margin:auto;cursor:pointer;top:50%;transform:translateY(-50%)}.autocomplete-container .suggestions-container .x i{color:#0000008a;font-size:18px;vertical-align:middle}.autocomplete-container .suggestions-container.is-hidden{visibility:hidden}.autocomplete-container .suggestions-container.is-visible{visibility:visible}.autocomplete-container .not-found{padding:0 .75em;border:solid 1px #f1f1f1;background:white}.autocomplete-container .not-found div{padding:.4em 0;font-size:.95em;line-height:1.4;border-bottom:1px solid rgba(230,230,230,.7)}.autocomplete-container.active{z-index:999}.highlight{font-weight:700}.autocomplete-overlay{position:fixed;background-color:transparent;width:100%;height:100%;top:0;right:0;bottom:0;left:0;z-index:50}input[type=text]::-ms-clear{display:none}.sk-fading-circle{width:20px;height:20px;position:absolute;right:10px;top:0;bottom:0;margin:auto}.sk-fading-circle .sk-circle{width:100%;height:100%;position:absolute;left:0;top:0}.sk-fading-circle .sk-circle:before{content:\"\";display:block;margin:0 auto;width:15%;height:15%;background-color:#333;border-radius:100%;animation:sk-circleFadeDelay 1.2s infinite ease-in-out both}.sk-fading-circle .sk-circle2{transform:rotate(30deg)}.sk-fading-circle .sk-circle3{transform:rotate(60deg)}.sk-fading-circle .sk-circle4{transform:rotate(90deg)}.sk-fading-circle .sk-circle5{transform:rotate(120deg)}.sk-fading-circle .sk-circle6{transform:rotate(150deg)}.sk-fading-circle .sk-circle7{transform:rotate(180deg)}.sk-fading-circle .sk-circle8{transform:rotate(210deg)}.sk-fading-circle .sk-circle9{transform:rotate(240deg)}.sk-fading-circle .sk-circle10{transform:rotate(270deg)}.sk-fading-circle .sk-circle11{transform:rotate(300deg)}.sk-fading-circle .sk-circle12{transform:rotate(330deg)}.sk-fading-circle .sk-circle2:before{animation-delay:-1.1s}.sk-fading-circle .sk-circle3:before{animation-delay:-1s}.sk-fading-circle .sk-circle4:before{animation-delay:-.9s}.sk-fading-circle .sk-circle5:before{animation-delay:-.8s}.sk-fading-circle .sk-circle6:before{animation-delay:-.7s}.sk-fading-circle .sk-circle7:before{animation-delay:-.6s}.sk-fading-circle .sk-circle8:before{animation-delay:-.5s}.sk-fading-circle .sk-circle9:before{animation-delay:-.4s}.sk-fading-circle .sk-circle10:before{animation-delay:-.3s}.sk-fading-circle .sk-circle11:before{animation-delay:-.2s}.sk-fading-circle .sk-circle12:before{animation-delay:-.1s}@keyframes sk-circleFadeDelay{0%,39%,to{opacity:0}40%{opacity:1}}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.Renderer2 }]; }, propDecorators: { searchInput: [{
                type: ViewChild,
                args: ['searchInput']
            }], filteredListElement: [{
                type: ViewChild,
                args: ['filteredListElement']
            }], historyListElement: [{
                type: ViewChild,
                args: ['historyListElement']
            }], data: [{
                type: Input
            }], searchKeyword: [{
                type: Input
            }], placeholder: [{
                type: Input
            }], heading: [{
                type: Input
            }], initialValue: [{
                type: Input
            }], historyIdentifier: [{
                type: Input
            }], historyHeading: [{
                type: Input
            }], historyListMaxNumber: [{
                type: Input
            }], notFoundText: [{
                type: Input
            }], isLoading: [{
                type: Input
            }], debounceTime: [{
                type: Input
            }], disabled: [{
                type: Input
            }], minQueryLength: [{
                type: Input
            }], focusFirst: [{
                type: Input
            }], customFilter: [{
                type: Input
            }], selectedValueRender: [{
                type: Input
            }], selected: [{
                type: Output
            }], inputChanged: [{
                type: Output
            }], inputFocused: [{
                type: Output
            }], inputCleared: [{
                type: Output
            }], opened: [{
                type: Output
            }], closed: [{
                type: Output
            }], scrolledToEnd: [{
                type: Output
            }], itemTemplate: [{
                type: Input
            }], notFoundTemplate: [{
                type: Input
            }], customTemplate: [{
                type: ContentChild,
                args: [TemplateRef]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2F1dG9jb21wbGV0ZS1saWIvc3JjL2xpYi9hdXRvY29tcGxldGUuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vcHJvamVjdHMvYXV0b2NvbXBsZXRlLWxpYi9zcmMvbGliL2F1dG9jb21wbGV0ZS5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsU0FBUyxFQUFFLFlBQVksRUFDdkIsVUFBVSxFQUNWLFlBQVksRUFBRSxVQUFVLEVBQ3hCLEtBQUssRUFFTCxNQUFNLEVBQ04sU0FBUyxFQUNNLFdBQVcsRUFDMUIsU0FBUyxFQUNULGlCQUFpQixFQUNsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsU0FBUyxFQUFhLE1BQU0sTUFBTSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pELE9BQU8sRUFBdUIsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7QUFFdkU7O0dBRUc7QUFDSCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7QUFDNUMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEtBQUssRUFBRSxDQUFDO0FBQzlDLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM1RSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7QUFDMUMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEtBQUssQ0FBQyxDQUFDO0FBQzdD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SztnQkFDVSxZQUFZO3NCQUEzQixLQUFLO2dCQUNVLFNBQVM7c0JBQXhCLEtBQUs7Z0JBQ1UsWUFBWTtzQkFBM0IsS0FBSztnQkFDVSxRQUFRO3NCQUF2QixLQUFLO2dCQUlVLGNBQWM7c0JBQTdCLEtBQUs7Z0JBS1UsVUFBVTtzQkFBekIsS0FBSztnQkFLVSxZQUFZO3NCQUEzQixLQUFLO2dCQU1VLG1CQUFtQjtzQkFBbEMsS0FBSztnQkFJSSxRQUFRO3NCQUFqQixNQUFNO2dCQUdHLFlBQVk7c0JBQXJCLE1BQU07Z0JBR1ksWUFBWTtzQkFBOUIsTUFBTTtnQkFHWSxZQUFZO3NCQUE5QixNQUFNO2dCQUdZLE1BQU07c0JBQXhCLE1BQU07Z0JBR1ksTUFBTTtzQkFBeEIsTUFBTTtnQkFHWSxhQUFhO3NCQUEvQixNQUFNO2dCQUlFLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNxQixjQUFjO3NCQUF4QyxZQUFZO3VCQUFDLFdBQVciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb21wb25lbnQsIENvbnRlbnRDaGlsZCxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLCBmb3J3YXJkUmVmLFxuICBJbnB1dCwgT25DaGFuZ2VzLFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgUmVuZGVyZXIyLFxuICBTaW1wbGVDaGFuZ2VzLCBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvblxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7ZnJvbUV2ZW50LCBPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZGVib3VuY2VUaW1lLCBmaWx0ZXIsIG1hcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtDb250cm9sVmFsdWVBY2Nlc3NvciwgTkdfVkFMVUVfQUNDRVNTT1J9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcblxuLyoqXG4gKiBLZXlib2FyZCBldmVudHNcbiAqL1xuY29uc3QgaXNBcnJvd1VwID0ga2V5Q29kZSA9PiBrZXlDb2RlID09PSAzODtcbmNvbnN0IGlzQXJyb3dEb3duID0ga2V5Q29kZSA9PiBrZXlDb2RlID09PSA0MDtcbmNvbnN0IGlzQXJyb3dVcERvd24gPSBrZXlDb2RlID0+IGlzQXJyb3dVcChrZXlDb2RlKSB8fCBpc0Fycm93RG93bihrZXlDb2RlKTtcbmNvbnN0IGlzRW50ZXIgPSBrZXlDb2RlID0+IGtleUNvZGUgPT09IDEzO1xuY29uc3QgaXNCYWNrc3BhY2UgPSBrZXlDb2RlID0+IGtleUNvZGUgPT09IDg7XG5jb25zdCBpc0RlbGV0ZSA9IGtleUNvZGUgPT4ga2V5Q29kZSA9PT0gNDY7XG5jb25zdCBpc0VTQyA9IGtleUNvZGUgPT4ga2V5Q29kZSA9PT0gMjc7XG5jb25zdCBpc1RhYiA9IGtleUNvZGUgPT4ga2V5Q29kZSA9PT0gOTtcblxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICduZy1hdXRvY29tcGxldGUnLFxuICB0ZW1wbGF0ZVVybDogJy4vYXV0b2NvbXBsZXRlLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vYXV0b2NvbXBsZXRlLmNvbXBvbmVudC5zY3NzJ10sXG4gIHByb3ZpZGVyczogW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxuICAgICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gQXV0b2NvbXBsZXRlQ29tcG9uZW50KSxcbiAgICAgIG11bHRpOiB0cnVlXG4gICAgfVxuICBdLFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBob3N0OiB7XG4gICAgJyhkb2N1bWVudDpjbGljayknOiAnaGFuZGxlQ2xpY2soJGV2ZW50KScsXG4gICAgJ2NsYXNzJzogJ25nLWF1dG9jb21wbGV0ZSdcbiAgfSxcbn0pXG5cbmV4cG9ydCBjbGFzcyBBdXRvY29tcGxldGVDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcywgQWZ0ZXJWaWV3SW5pdCwgQ29udHJvbFZhbHVlQWNjZXNzb3Ige1xuICBAVmlld0NoaWxkKCdzZWFyY2hJbnB1dCcpIHNlYXJjaElucHV0OiBFbGVtZW50UmVmOyAvLyBpbnB1dCBlbGVtZW50XG4gIEBWaWV3Q2hpbGQoJ2ZpbHRlcmVkTGlzdEVsZW1lbnQnKSBmaWx0ZXJlZExpc3RFbGVtZW50OiBFbGVtZW50UmVmOyAvLyBlbGVtZW50IG9mIGl0ZW1zXG4gIEBWaWV3Q2hpbGQoJ2hpc3RvcnlMaXN0RWxlbWVudCcpIGhpc3RvcnlMaXN0RWxlbWVudDogRWxlbWVudFJlZjsgLy8gZWxlbWVudCBvZiBoaXN0b3J5IGl0ZW1zXG5cbiAgaW5wdXRLZXlVcCQ6IE9ic2VydmFibGU8YW55PjtcbiAgaW5wdXRLZXlEb3duJDogT2JzZXJ2YWJsZTxhbnk+O1xuXG4gIHB1YmxpYyBxdWVyeSA9ICcnOyAvLyBzZWFyY2ggcXVlcnlcbiAgcHVibGljIGZpbHRlcmVkTGlzdCA9IFtdOyAvLyBsaXN0IG9mIGl0ZW1zXG4gIHB1YmxpYyBoaXN0b3J5TGlzdCA9IFtdOyAvLyBsaXN0IG9mIGhpc3RvcnkgaXRlbXNcbiAgcHVibGljIGlzSGlzdG9yeUxpc3RWaXNpYmxlID0gdHJ1ZTtcbiAgcHVibGljIGVsZW1lbnRSZWY7XG4gIHB1YmxpYyBzZWxlY3RlZElkeCA9IC0xO1xuICBwdWJsaWMgdG9IaWdobGlnaHQgPSAnJztcbiAgcHVibGljIG5vdEZvdW5kID0gZmFsc2U7XG4gIHB1YmxpYyBpc0ZvY3VzZWQgPSBmYWxzZTtcbiAgcHVibGljIGlzT3BlbiA9IGZhbHNlO1xuICBwdWJsaWMgaXNTY3JvbGxUb0VuZCA9IGZhbHNlO1xuICBwdWJsaWMgb3ZlcmxheSA9IGZhbHNlO1xuICBwcml2YXRlIG1hbnVhbE9wZW4gPSB1bmRlZmluZWQ7XG4gIHByaXZhdGUgbWFudWFsQ2xvc2UgPSB1bmRlZmluZWQ7XG5cblxuICAvLyBASW5wdXRzXG4gIC8qKlxuICAgKiBEYXRhIG9mIGl0ZW1zIGxpc3QuXG4gICAqIEl0IGNhbiBiZSBhcnJheSBvZiBzdHJpbmdzIG9yIGFycmF5IG9mIG9iamVjdHMuXG4gICAqL1xuICBASW5wdXQoKSBwdWJsaWMgZGF0YSA9IFtdO1xuICBASW5wdXQoKSBwdWJsaWMgc2VhcmNoS2V5d29yZDogc3RyaW5nOyAvLyBrZXl3b3JkIHRvIGZpbHRlciB0aGUgbGlzdFxuICBASW5wdXQoKSBwdWJsaWMgcGxhY2Vob2xkZXIgPSAnJztcbiAgQElucHV0KCkgcHVibGljIGhlYWRpbmcgPSAnJztcbiAgQElucHV0KCkgcHVibGljIGluaXRpYWxWYWx1ZTogYW55O1xuICAvKipcbiAgICogSGlzdG9yeSBpZGVudGlmaWVyIG9mIGhpc3RvcnkgbGlzdFxuICAgKiBXaGVuIHZhbGlkIGhpc3RvcnkgaWRlbnRpZmllciBpcyBnaXZlbiwgdGhlbiBjb21wb25lbnQgc3RvcmVzIHNlbGVjdGVkIGl0ZW0gdG8gbG9jYWwgc3RvcmFnZSBvZiB1c2VyJ3MgYnJvd3Nlci5cbiAgICogSWYgaXQgaXMgbnVsbCB0aGVuIGhpc3RvcnkgaXMgaGlkZGVuLlxuICAgKiBIaXN0b3J5IGxpc3QgaXMgdmlzaWJsZSBpZiBhdCBsZWFzdCBvbmUgaGlzdG9yeSBpdGVtIGlzIHN0b3JlZC5cbiAgICovXG4gIEBJbnB1dCgpIHB1YmxpYyBoaXN0b3J5SWRlbnRpZmllcjogc3RyaW5nO1xuICAvKipcbiAgICogSGVhZGluZyB0ZXh0IG9mIGhpc3RvcnkgbGlzdC5cbiAgICogSWYgaXQgaXMgbnVsbCB0aGVuIGhpc3RvcnkgaGVhZGluZyBpcyBoaWRkZW4uXG4gICAqL1xuICBASW5wdXQoKSBwdWJsaWMgaGlzdG9yeUhlYWRpbmcgPSAnUmVjZW50bHkgc2VsZWN0ZWQnO1xuICBASW5wdXQoKSBwdWJsaWMgaGlzdG9yeUxpc3RNYXhOdW1iZXIgPSAxNTsgLy8gbWF4aW11bSBudW1iZXIgb2YgaXRlbXMgaW4gdGhlIGhpc3RvcnkgbGlzdC5cbiAgQElucHV0KCkgcHVibGljIG5vdEZvdW5kVGV4dCA9ICdOb3QgZm91bmQnOyAvLyBzZXQgY3VzdG9tIHRleHQgd2hlbiBmaWx0ZXIgcmV0dXJucyBlbXB0eSByZXN1bHRcbiAgQElucHV0KCkgcHVibGljIGlzTG9hZGluZzogYm9vbGVhbjsgLy8gbG9hZGluZyBtYXNrXG4gIEBJbnB1dCgpIHB1YmxpYyBkZWJvdW5jZVRpbWU6IG51bWJlcjsgLy8gZGVsYXkgdGltZSB3aGlsZSB0eXBpbmdcbiAgQElucHV0KCkgcHVibGljIGRpc2FibGVkOiBib29sZWFuOyAvLyBpbnB1dCBkaXNhYmxlL2VuYWJsZVxuICAvKipcbiAgICogVGhlIG1pbmltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnMgdGhlIHVzZXIgbXVzdCB0eXBlIGJlZm9yZSBhIHNlYXJjaCBpcyBwZXJmb3JtZWQuXG4gICAqL1xuICBASW5wdXQoKSBwdWJsaWMgbWluUXVlcnlMZW5ndGggPSAxO1xuXG4gIC8qKlxuICAgKiBGb2N1cyBmaXJzdCBpdGVtIGluIHRoZSBsaXN0XG4gICAqL1xuICBASW5wdXQoKSBwdWJsaWMgZm9jdXNGaXJzdCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBDdXN0b20gZmlsdGVyIGZ1bmN0aW9uXG4gICAqL1xuICBASW5wdXQoKSBwdWJsaWMgY3VzdG9tRmlsdGVyOiAoaXRlbXM6IGFueVtdLCBxdWVyeTogc3RyaW5nKSA9PiBhbnlbXTtcblxuICAvKipcbiAgICogQ3VzdG9tIHJlc3VsdCByZW5kZXIgZnVuY3Rpb25cbiAgICogQHBhcmFtIHZhbHVlIC0gc2VsZWN0ZWQgdmFsdWUgdG8gYmUgcmVuZGVyZWQgaW5zaWRlIGlucHV0IGZpZWxkXG4gICAqL1xuICBASW5wdXQoKSBwdWJsaWMgc2VsZWN0ZWRWYWx1ZVJlbmRlcjogKHZhbHVlOiBhbnkpID0+IHN0cmluZztcblxuICAvLyBAT3V0cHV0IGV2ZW50c1xuICAvKiogRXZlbnQgdGhhdCBpcyBlbWl0dGVkIHdoZW5ldmVyIGFuIGl0ZW0gZnJvbSB0aGUgbGlzdCBpcyBzZWxlY3RlZC4gKi9cbiAgQE91dHB1dCgpIHNlbGVjdGVkID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG5cbiAgLyoqIEV2ZW50IHRoYXQgaXMgZW1pdHRlZCB3aGVuZXZlciBhbiBpbnB1dCBpcyBjaGFuZ2VkLiAqL1xuICBAT3V0cHV0KCkgaW5wdXRDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG5cbiAgLyoqIEV2ZW50IHRoYXQgaXMgZW1pdHRlZCB3aGVuZXZlciBhbiBpbnB1dCBpcyBmb2N1c2VkLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgaW5wdXRGb2N1c2VkOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqIEV2ZW50IHRoYXQgaXMgZW1pdHRlZCB3aGVuZXZlciBhbiBpbnB1dCBpcyBjbGVhcmVkLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgaW5wdXRDbGVhcmVkOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqIEV2ZW50IHRoYXQgaXMgZW1pdHRlZCB3aGVuIHRoZSBhdXRvY29tcGxldGUgcGFuZWwgaXMgb3BlbmVkLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgb3BlbmVkOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqIEV2ZW50IHRoYXQgaXMgZW1pdHRlZCB3aGVuIHRoZSBhdXRvY29tcGxldGUgcGFuZWwgaXMgY2xvc2VkLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgY2xvc2VkOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqIEV2ZW50IHRoYXQgaXMgZW1pdHRlZCB3aGVuIHNjcm9sbGVkIHRvIHRoZSBlbmQgb2YgaXRlbXMuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBzY3JvbGxlZFRvRW5kOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cblxuICAvLyBDdXN0b20gdGVtcGxhdGVzXG4gIEBJbnB1dCgpIGl0ZW1UZW1wbGF0ZSAhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBub3RGb3VuZFRlbXBsYXRlICE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBDb250ZW50Q2hpbGQoVGVtcGxhdGVSZWYpIGN1c3RvbVRlbXBsYXRlICE6IFRlbXBsYXRlUmVmPGFueT47XG5cbiAgLyoqXG4gICAqIFByb3BhZ2F0ZXMgbmV3IHZhbHVlIHdoZW4gbW9kZWwgY2hhbmdlc1xuICAgKi9cbiAgcHJvcGFnYXRlQ2hhbmdlOiBhbnkgPSAoKSA9PiB7XG4gIH07XG5cbiAgb25Ub3VjaGVkOiBhbnkgPSAoKSA9PiB7XG4gIH07XG5cbiAgLyoqXG4gICAqIFdyaXRlcyBhIG5ldyB2YWx1ZSBmcm9tIHRoZSBmb3JtIG1vZGVsIGludG8gdGhlIHZpZXcsXG4gICAqIFVwZGF0ZXMgbW9kZWxcbiAgICovXG4gIHdyaXRlVmFsdWUodmFsdWU6IGFueSA9ICcnKSB7XG4gICAgdGhpcy5xdWVyeSA9IHRoaXMuc2VsZWN0ZWRWYWx1ZVJlbmRlciAhPT0gdW5kZWZpbmVkID8gdGhpcy5zZWxlY3RlZFZhbHVlUmVuZGVyKHZhbHVlKSA6IHRoaXMuZGVmYXVsdFdyaXRlVmFsdWUodmFsdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBkZWZhdWx0V3JpdGVWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHZhbHVlICYmICF0aGlzLmlzVHlwZVN0cmluZyh2YWx1ZSkgPyB2YWx1ZVt0aGlzLnNlYXJjaEtleXdvcmRdIDogdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgaGFuZGxlciB0aGF0IGlzIGNhbGxlZCB3aGVuIHNvbWV0aGluZyBpbiB0aGUgdmlldyBoYXMgY2hhbmdlZFxuICAgKi9cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbikge1xuICAgIHRoaXMucHJvcGFnYXRlQ2hhbmdlID0gZm47XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgaGFuZGxlciBzcGVjaWZpY2FsbHkgZm9yIHdoZW4gYSBjb250cm9sIHJlY2VpdmVzIGEgdG91Y2ggZXZlbnRcbiAgICovXG4gIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5vblRvdWNoZWQgPSBmbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSB2YWx1ZSBvZiBhbiBpbnB1dCBlbGVtZW50IGlzIGNoYW5nZWRcbiAgICovXG4gIG9uQ2hhbmdlKGV2ZW50KSB7XG4gICAgdGhpcy5wcm9wYWdhdGVDaGFuZ2UoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsIHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMikge1xuICAgIHRoaXMuZWxlbWVudFJlZiA9IGVsZW1lbnRSZWY7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGUgY29udHJvbCBzdGF0dXMgY2hhbmdlcyB0byBvciBmcm9tIERJU0FCTEVEXG4gICAqL1xuICBzZXREaXNhYmxlZFN0YXRlKGlzRGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLmRpc2FibGVkID0gaXNEaXNhYmxlZDtcbiAgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIHRoaXMuaW5pdEV2ZW50U3RyZWFtKCk7XG4gICAgdGhpcy5oYW5kbGVTY3JvbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgaW5pdGlhbCB2YWx1ZVxuICAgKiBAcGFyYW0gdmFsdWVcbiAgICovXG4gIHB1YmxpYyBzZXRJbml0aWFsVmFsdWUodmFsdWU6IGFueSkge1xuICAgIGlmICh0aGlzLmluaXRpYWxWYWx1ZSkge1xuICAgICAgdGhpcy5zZWxlY3QodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgc2VhcmNoIHJlc3VsdHNcbiAgICovXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICB0aGlzLnNldEluaXRpYWxWYWx1ZSh0aGlzLmluaXRpYWxWYWx1ZSk7XG4gICAgaWYgKFxuICAgICAgY2hhbmdlcyAmJlxuICAgICAgY2hhbmdlcy5kYXRhICYmXG4gICAgICBBcnJheS5pc0FycmF5KGNoYW5nZXMuZGF0YS5jdXJyZW50VmFsdWUpXG4gICAgKSB7XG4gICAgICB0aGlzLmhhbmRsZUl0ZW1zQ2hhbmdlKCk7XG4gICAgICBpZiAoIWNoYW5nZXMuZGF0YS5maXJzdENoYW5nZSAmJiB0aGlzLmlzRm9jdXNlZCkge1xuICAgICAgICB0aGlzLmhhbmRsZU9wZW4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSXRlbXMgY2hhbmdlXG4gICAqL1xuICBwdWJsaWMgaGFuZGxlSXRlbXNDaGFuZ2UoKSB7XG4gICAgdGhpcy5pc1Njcm9sbFRvRW5kID0gZmFsc2U7XG4gICAgaWYgKCF0aGlzLmlzT3Blbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZmlsdGVyZWRMaXN0ID0gdGhpcy5kYXRhO1xuICAgIHRoaXMubm90Rm91bmQgPSAhdGhpcy5maWx0ZXJlZExpc3QgfHwgdGhpcy5maWx0ZXJlZExpc3QubGVuZ3RoID09PSAwO1xuXG4gICAgLy8gRmlsdGVyIGxpc3Qgd2hlbiB1cGRhdGluZyBkYXRhIGFuZCBwYW5lbCBpcyBvcGVuXG4gICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICB0aGlzLmZpbHRlckxpc3QoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmlsdGVyIGRhdGFcbiAgICovXG4gIHB1YmxpYyBmaWx0ZXJMaXN0KCkge1xuICAgIHRoaXMuc2VsZWN0ZWRJZHggPSAtMTtcbiAgICB0aGlzLmluaXRTZWFyY2hIaXN0b3J5KCk7XG4gICAgaWYgKHRoaXMucXVlcnkgIT0gbnVsbCAmJiB0aGlzLmRhdGEpIHtcbiAgICAgIHRoaXMudG9IaWdobGlnaHQgPSB0aGlzLnF1ZXJ5O1xuICAgICAgdGhpcy5maWx0ZXJlZExpc3QgPSB0aGlzLmN1c3RvbUZpbHRlciAhPT0gdW5kZWZpbmVkID8gdGhpcy5jdXN0b21GaWx0ZXIoWy4uLnRoaXMuZGF0YV0sIHRoaXMucXVlcnkpIDogdGhpcy5kZWZhdWx0RmlsdGVyRnVuY3Rpb24oKTtcbiAgICAgIC8vIElmIFtmb2N1c0ZpcnN0XT1cInRydWVcIiBhdXRvbWF0aWNhbGx5IGZvY3VzIHRoZSBmaXJzdCBtYXRjaFxuICAgICAgaWYgKHRoaXMuZmlsdGVyZWRMaXN0Lmxlbmd0aCA+IDAgJiYgdGhpcy5mb2N1c0ZpcnN0KSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJZHggPSAwO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm5vdEZvdW5kID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgZmlsdGVyIGZ1bmN0aW9uLCB1c2VkIHVubGVzcyBjdXN0b21GaWx0ZXIgaXMgcHJvdmlkZWRcbiAgICovXG4gIHB1YmxpYyBkZWZhdWx0RmlsdGVyRnVuY3Rpb24oKTogYW55W10ge1xuICAgIHJldHVybiB0aGlzLmRhdGEuZmlsdGVyKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gc3RyaW5nIGxvZ2ljLCBjaGVjayBlcXVhbGl0eSBvZiBzdHJpbmdzXG4gICAgICAgIHJldHVybiBpdGVtLnRvTG93ZXJDYXNlKCkuaW5kZXhPZih0aGlzLnF1ZXJ5LnRvTG93ZXJDYXNlKCkpID4gLTE7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0JyAmJiBpdGVtIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgIC8vIG9iamVjdCBsb2dpYywgY2hlY2sgcHJvcGVydHkgZXF1YWxpdHlcbiAgICAgICAgcmV0dXJuIGl0ZW1bdGhpcy5zZWFyY2hLZXl3b3JkXSA/IGl0ZW1bdGhpcy5zZWFyY2hLZXl3b3JkXS50b0xvd2VyQ2FzZSgpLmluZGV4T2YodGhpcy5xdWVyeS50b0xvd2VyQ2FzZSgpKSA+IC0xIDogXCJcIjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGl0ZW0gaXMgYSBzdHJpbmcgaW4gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSBpdGVtXG4gICAqL1xuICBpc1R5cGVTdHJpbmcoaXRlbSkge1xuICAgIHJldHVybiB0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZyc7XG4gIH1cblxuICAvKipcbiAgICogU2VsZWN0IGl0ZW0gaW4gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSBpdGVtXG4gICAqL1xuICBwdWJsaWMgc2VsZWN0KGl0ZW0pIHtcbiAgICB0aGlzLnF1ZXJ5ID0gIXRoaXMuaXNUeXBlU3RyaW5nKGl0ZW0pID8gaXRlbVt0aGlzLnNlYXJjaEtleXdvcmRdIDogaXRlbTtcbiAgICB0aGlzLmlzT3BlbiA9IHRydWU7XG4gICAgdGhpcy5vdmVybGF5ID0gZmFsc2U7XG4gICAgdGhpcy5zZWxlY3RlZC5lbWl0KGl0ZW0pO1xuICAgIHRoaXMucHJvcGFnYXRlQ2hhbmdlKGl0ZW0pO1xuXG4gICAgaWYgKHRoaXMuaW5pdGlhbFZhbHVlKSB7XG4gICAgICAvLyBjaGVjayBpZiBoaXN0b3J5IGFscmVhZHkgZXhpc3RzIGluIGxvY2FsU3RvcmFnZSBhbmQgdGhlbiB1cGRhdGVcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oYCR7dGhpcy5oaXN0b3J5SWRlbnRpZmllcn1gKTtcbiAgICAgIGlmIChoaXN0b3J5KSB7XG4gICAgICAgIGxldCBleGlzdGluZ0hpc3RvcnkgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtgJHt0aGlzLmhpc3RvcnlJZGVudGlmaWVyfWBdKTtcbiAgICAgICAgaWYgKCEoZXhpc3RpbmdIaXN0b3J5IGluc3RhbmNlb2YgQXJyYXkpKSBleGlzdGluZ0hpc3RvcnkgPSBbXTtcblxuICAgICAgICAvLyBjaGVjayBpZiBzZWxlY3RlZCBpdGVtIGV4aXN0cyBpbiBleGlzdGluZ0hpc3RvcnlcbiAgICAgICAgaWYgKCFleGlzdGluZ0hpc3Rvcnkuc29tZSgoZXhpc3RpbmdJdGVtKSA9PiAhdGhpcy5pc1R5cGVTdHJpbmcoZXhpc3RpbmdJdGVtKVxuICAgICAgICAgID8gZXhpc3RpbmdJdGVtW3RoaXMuc2VhcmNoS2V5d29yZF0gPT0gaXRlbVt0aGlzLnNlYXJjaEtleXdvcmRdIDogZXhpc3RpbmdJdGVtID09IGl0ZW0pKSB7XG4gICAgICAgICAgZXhpc3RpbmdIaXN0b3J5LnVuc2hpZnQoaXRlbSk7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oYCR7dGhpcy5oaXN0b3J5SWRlbnRpZmllcn1gLCBKU09OLnN0cmluZ2lmeShleGlzdGluZ0hpc3RvcnkpKTtcblxuICAgICAgICAgIC8vIGNoZWNrIGlmIGl0ZW1zIGRvbid0IGV4Y2VlZCBtYXggYWxsb3dlZCBudW1iZXJcbiAgICAgICAgICBpZiAoZXhpc3RpbmdIaXN0b3J5Lmxlbmd0aCA+PSB0aGlzLmhpc3RvcnlMaXN0TWF4TnVtYmVyKSB7XG4gICAgICAgICAgICBleGlzdGluZ0hpc3Rvcnkuc3BsaWNlKGV4aXN0aW5nSGlzdG9yeS5sZW5ndGggLSAxLCAxKTtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGAke3RoaXMuaGlzdG9yeUlkZW50aWZpZXJ9YCwgSlNPTi5zdHJpbmdpZnkoZXhpc3RpbmdIaXN0b3J5KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGlmIHNlbGVjdGVkIGl0ZW0gZXhpc3RzIGluIGV4aXN0aW5nSGlzdG9yeSBzd2FwIHRvIHRvcCBpbiBhcnJheVxuICAgICAgICAgIGlmICghdGhpcy5pc1R5cGVTdHJpbmcoaXRlbSkpIHtcbiAgICAgICAgICAgIC8vIG9iamVjdCBsb2dpY1xuICAgICAgICAgICAgY29uc3QgY29waWVkRXhpc3RpbmdIaXN0b3J5ID0gZXhpc3RpbmdIaXN0b3J5LnNsaWNlKCk7IC8vIGNvcHkgb3JpZ2luYWwgZXhpc3RpbmdIaXN0b3J5IGFycmF5XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RlZEluZGV4ID0gY29waWVkRXhpc3RpbmdIaXN0b3J5Lm1hcCgoZWwpID0+IGVsW3RoaXMuc2VhcmNoS2V5d29yZF0pLmluZGV4T2YoaXRlbVt0aGlzLnNlYXJjaEtleXdvcmRdKTtcbiAgICAgICAgICAgIGNvcGllZEV4aXN0aW5nSGlzdG9yeS5zcGxpY2Uoc2VsZWN0ZWRJbmRleCwgMSk7XG4gICAgICAgICAgICBjb3BpZWRFeGlzdGluZ0hpc3Rvcnkuc3BsaWNlKDAsIDAsIGl0ZW0pO1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oYCR7dGhpcy5oaXN0b3J5SWRlbnRpZmllcn1gLCBKU09OLnN0cmluZ2lmeShjb3BpZWRFeGlzdGluZ0hpc3RvcnkpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc3RyaW5nIGxvZ2ljXG4gICAgICAgICAgICBjb25zdCBjb3BpZWRFeGlzdGluZ0hpc3RvcnkgPSBleGlzdGluZ0hpc3Rvcnkuc2xpY2UoKTsgLy8gY29weSBvcmlnaW5hbCBleGlzdGluZ0hpc3RvcnkgYXJyYXlcbiAgICAgICAgICAgIGNvcGllZEV4aXN0aW5nSGlzdG9yeS5zcGxpY2UoY29waWVkRXhpc3RpbmdIaXN0b3J5LmluZGV4T2YoaXRlbSksIDEpO1xuICAgICAgICAgICAgY29waWVkRXhpc3RpbmdIaXN0b3J5LnNwbGljZSgwLCAwLCBpdGVtKTtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGAke3RoaXMuaGlzdG9yeUlkZW50aWZpZXJ9YCwgSlNPTi5zdHJpbmdpZnkoY29waWVkRXhpc3RpbmdIaXN0b3J5KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNhdmVIaXN0b3J5KGl0ZW0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNhdmVIaXN0b3J5KGl0ZW0pO1xuICAgIH1cbiAgICB0aGlzLmhhbmRsZUNsb3NlKCk7XG4gIH1cblxuICAvKipcbiAgICogRG9jdW1lbnQgY2xpY2tcbiAgICogQHBhcmFtIGUgZXZlbnRcbiAgICovXG4gIHB1YmxpYyBoYW5kbGVDbGljayhlKSB7XG4gICAgbGV0IGNsaWNrZWRDb21wb25lbnQgPSBlLnRhcmdldDtcbiAgICBsZXQgaW5zaWRlID0gZmFsc2U7XG4gICAgZG8ge1xuICAgICAgaWYgKGNsaWNrZWRDb21wb25lbnQgPT09IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSB7XG4gICAgICAgIGluc2lkZSA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmZpbHRlcmVkTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLmhhbmRsZU9wZW4oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2xpY2tlZENvbXBvbmVudCA9IGNsaWNrZWRDb21wb25lbnQucGFyZW50Tm9kZTtcbiAgICB9IHdoaWxlIChjbGlja2VkQ29tcG9uZW50KTtcbiAgICBpZiAoIWluc2lkZSkge1xuICAgICAgdGhpcy5oYW5kbGVDbG9zZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYm9keSBvdmVybGF5XG4gICAqL1xuICBoYW5kbGVPdmVybGF5KCkge1xuICAgIHRoaXMub3ZlcmxheSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbCBpdGVtc1xuICAgKi9cbiAgcHVibGljIGhhbmRsZVNjcm9sbCgpIHtcbiAgICB0aGlzLnJlbmRlcmVyLmxpc3Rlbih0aGlzLmZpbHRlcmVkTGlzdEVsZW1lbnQubmF0aXZlRWxlbWVudCwgJ3Njcm9sbCcsICgpID0+IHtcbiAgICAgIHRoaXMuc2Nyb2xsVG9FbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZpbmUgcGFuZWwgc3RhdGVcbiAgICovXG4gIHNldFBhbmVsU3RhdGUoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgICAvLyBJZiBjb250cm9scyBhcmUgdW50b3VjaGVkXG4gICAgaWYgKHR5cGVvZiB0aGlzLm1hbnVhbE9wZW4gPT09ICd1bmRlZmluZWQnXG4gICAgICAmJiB0eXBlb2YgdGhpcy5tYW51YWxDbG9zZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICB0aGlzLmhhbmRsZU9wZW4oKTtcbiAgICB9XG5cbiAgICAvLyBJZiBvbmUgb2YgdGhlIGNvbnRyb2xzIGlzIHVudG91Y2hlZCBhbmQgb3RoZXIgaXMgZGVhY3RpdmF0ZWRcbiAgICBpZiAodHlwZW9mIHRoaXMubWFudWFsT3BlbiA9PT0gJ3VuZGVmaW5lZCdcbiAgICAgICYmIHRoaXMubWFudWFsQ2xvc2UgPT09IGZhbHNlXG4gICAgICB8fCB0eXBlb2YgdGhpcy5tYW51YWxDbG9zZSA9PT0gJ3VuZGVmaW5lZCdcbiAgICAgICYmIHRoaXMubWFudWFsT3BlbiA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICB0aGlzLmhhbmRsZU9wZW4oKTtcbiAgICB9XG5cbiAgICAvLyBpZiBjb250cm9scyBhcmUgdG91Y2hlZCBidXQgYm90aCBhcmUgZGVhY3RpdmF0ZWRcbiAgICBpZiAodGhpcy5tYW51YWxPcGVuID09PSBmYWxzZSAmJiB0aGlzLm1hbnVhbENsb3NlID09PSBmYWxzZSkge1xuICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcbiAgICAgIHRoaXMuaGFuZGxlT3BlbigpO1xuICAgIH1cblxuICAgIC8vIGlmIG9wZW4gY29udHJvbCBpcyB0b3VjaGVkIGFuZCBhY3RpdmF0ZWRcbiAgICBpZiAodGhpcy5tYW51YWxPcGVuKSB7XG4gICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgdGhpcy5oYW5kbGVPcGVuKCk7XG4gICAgICB0aGlzLm1hbnVhbE9wZW4gPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBpZiBjbG9zZSBjb250cm9sIGlzIHRvdWNoZWQgYW5kIGFjdGl2YXRlZFxuICAgIGlmICh0aGlzLm1hbnVhbENsb3NlKSB7XG4gICAgICB0aGlzLmlzT3BlbiA9IHRydWU7XG4gICAgICB0aGlzLmhhbmRsZUNsb3NlKCk7XG4gICAgICB0aGlzLm1hbnVhbENsb3NlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hbnVhbCBjb250cm9sc1xuICAgKi9cbiAgb3BlbigpIHtcbiAgICB0aGlzLm1hbnVhbE9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgdGhpcy5oYW5kbGVPcGVuKCk7XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICB0aGlzLm1hbnVhbENsb3NlID0gdHJ1ZTtcbiAgICB0aGlzLmlzT3BlbiA9IHRydWU7XG4gICAgdGhpcy5oYW5kbGVDbG9zZSgpO1xuICB9XG5cbiAgZm9jdXMoKSB7XG4gICAgdGhpcy5oYW5kbGVGb2N1cyhldmVudCk7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICB0aGlzLnJlbW92ZShldmVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHNlYXJjaCBxdWVyeVxuICAgKi9cbiAgcHVibGljIHJlbW92ZShlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB0aGlzLnF1ZXJ5ID0gJyc7XG4gICAgdGhpcy5pbnB1dENsZWFyZWQuZW1pdCgpO1xuICAgIHRoaXMucHJvcGFnYXRlQ2hhbmdlKHRoaXMucXVlcnkpO1xuICAgIHRoaXMuc2V0UGFuZWxTdGF0ZShlKTtcblxuICAgIGlmICh0aGlzLmRhdGEgJiYgIXRoaXMuZGF0YS5sZW5ndGgpIHtcbiAgICAgIHRoaXMubm90Rm91bmQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBoaXN0b3J5TGlzdCBzZWFyY2hcbiAgICovXG4gIGluaXRTZWFyY2hIaXN0b3J5KCkge1xuICAgIHRoaXMuaXNIaXN0b3J5TGlzdFZpc2libGUgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5oaXN0b3J5SWRlbnRpZmllciAmJiAhdGhpcy5xdWVyeSkge1xuICAgICAgY29uc3QgaGlzdG9yeSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShgJHt0aGlzLmhpc3RvcnlJZGVudGlmaWVyfWApO1xuICAgICAgaWYgKGhpc3RvcnkpIHtcbiAgICAgICAgdGhpcy5pc0hpc3RvcnlMaXN0VmlzaWJsZSA9IHRydWU7XG4gICAgICAgIHRoaXMuZmlsdGVyZWRMaXN0ID0gW107XG4gICAgICAgIHRoaXMuaGlzdG9yeUxpc3QgPSBoaXN0b3J5ID8gSlNPTi5wYXJzZShoaXN0b3J5KSA6IFtdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pc0hpc3RvcnlMaXN0VmlzaWJsZSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlzSGlzdG9yeUxpc3RWaXNpYmxlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlT3BlbigpIHtcbiAgICBpZiAodGhpcy5pc09wZW4gfHwgdGhpcy5pc09wZW4gJiYgIXRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIElmIGRhdGEgZXhpc3RzXG4gICAgaWYgKHRoaXMuZGF0YSAmJiB0aGlzLmRhdGEubGVuZ3RoKSB7XG4gICAgICB0aGlzLmlzT3BlbiA9IHRydWU7XG4gICAgICB0aGlzLm92ZXJsYXkgPSB0cnVlO1xuICAgICAgdGhpcy5maWx0ZXJMaXN0KCk7XG4gICAgICB0aGlzLm9wZW5lZC5lbWl0KCk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlQ2xvc2UoKSB7XG4gICAgaWYgKCF0aGlzLmlzT3Blbikge1xuICAgICAgdGhpcy5pc0ZvY3VzZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcbiAgICB0aGlzLm92ZXJsYXkgPSBmYWxzZTtcbiAgICB0aGlzLmZpbHRlcmVkTGlzdCA9IFtdO1xuICAgIHRoaXMuc2VsZWN0ZWRJZHggPSAtMTtcbiAgICB0aGlzLm5vdEZvdW5kID0gZmFsc2U7XG4gICAgdGhpcy5pc0hpc3RvcnlMaXN0VmlzaWJsZSA9IGZhbHNlO1xuICAgIHRoaXMuaXNGb2N1c2VkID0gZmFsc2U7XG4gICAgdGhpcy5jbG9zZWQuZW1pdCgpO1xuICB9XG5cbiAgaGFuZGxlRm9jdXMoZSkge1xuICAgIHRoaXMuc2VhcmNoSW5wdXQubmF0aXZlRWxlbWVudC5mb2N1cygpO1xuICAgIGlmICh0aGlzLmlzRm9jdXNlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmlucHV0Rm9jdXNlZC5lbWl0KGUpO1xuICAgIC8vIGlmIGRhdGEgZXhpc3RzIHRoZW4gb3BlblxuICAgIGlmICh0aGlzLmRhdGEgJiYgdGhpcy5kYXRhLmxlbmd0aCkge1xuICAgICAgdGhpcy5zZXRQYW5lbFN0YXRlKGUpO1xuICAgIH1cbiAgICB0aGlzLmlzRm9jdXNlZCA9IHRydWU7XG4gIH1cblxuICBzY3JvbGxUb0VuZCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pc1Njcm9sbFRvRW5kKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2Nyb2xsVG9wID0gdGhpcy5maWx0ZXJlZExpc3RFbGVtZW50Lm5hdGl2ZUVsZW1lbnRcbiAgICAgIC5zY3JvbGxUb3A7XG4gICAgY29uc3Qgc2Nyb2xsSGVpZ2h0ID0gdGhpcy5maWx0ZXJlZExpc3RFbGVtZW50Lm5hdGl2ZUVsZW1lbnRcbiAgICAgIC5zY3JvbGxIZWlnaHQ7XG4gICAgY29uc3QgZWxlbWVudEhlaWdodCA9IHRoaXMuZmlsdGVyZWRMaXN0RWxlbWVudC5uYXRpdmVFbGVtZW50XG4gICAgICAuY2xpZW50SGVpZ2h0O1xuICAgIGNvbnN0IGF0Qm90dG9tID0gZWxlbWVudEhlaWdodCAhPTAgJiYgTWF0aC5hYnMoc2Nyb2xsSGVpZ2h0IC0gZWxlbWVudEhlaWdodCAtIHNjcm9sbFRvcCkgPCAxO1xuXG4gICAgaWYgKGF0Qm90dG9tKSB7XG4gICAgICB0aGlzLnNjcm9sbGVkVG9FbmQuZW1pdCgpO1xuICAgICAgdGhpcy5pc1Njcm9sbFRvRW5kID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBrZXlib2FyZCBldmVudHNcbiAgICovXG4gIGluaXRFdmVudFN0cmVhbSgpIHtcbiAgICB0aGlzLmlucHV0S2V5VXAkID0gZnJvbUV2ZW50KFxuICAgICAgdGhpcy5zZWFyY2hJbnB1dC5uYXRpdmVFbGVtZW50LCAna2V5dXAnXG4gICAgKS5waXBlKG1hcChcbiAgICAgIChlOiBhbnkpID0+IGVcbiAgICApKTtcblxuICAgIHRoaXMuaW5wdXRLZXlEb3duJCA9IGZyb21FdmVudChcbiAgICAgIHRoaXMuc2VhcmNoSW5wdXQubmF0aXZlRWxlbWVudCxcbiAgICAgICdrZXlkb3duJ1xuICAgICkucGlwZShtYXAoXG4gICAgICAoZTogYW55KSA9PiBlXG4gICAgKSk7XG5cbiAgICB0aGlzLmxpc3RlbkV2ZW50U3RyZWFtKCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdGVuIGtleWJvYXJkIGV2ZW50c1xuICAgKi9cbiAgbGlzdGVuRXZlbnRTdHJlYW0oKSB7XG4gICAgLy8ga2V5IHVwIGV2ZW50XG4gICAgdGhpcy5pbnB1dEtleVVwJFxuICAgICAgLnBpcGUoXG4gICAgICAgIGZpbHRlcihlID0+XG4gICAgICAgICAgIWlzQXJyb3dVcERvd24oZS5rZXlDb2RlKSAmJlxuICAgICAgICAgICFpc0VudGVyKGUua2V5Q29kZSkgJiZcbiAgICAgICAgICAhaXNFU0MoZS5rZXlDb2RlKSAmJlxuICAgICAgICAgICFpc1RhYihlLmtleUNvZGUpKSxcbiAgICAgICAgZGVib3VuY2VUaW1lKHRoaXMuZGVib3VuY2VUaW1lKVxuICAgICAgKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICB0aGlzLm9uS2V5VXAoZSk7XG4gICAgfSk7XG5cbiAgICAvLyBjdXJzb3IgdXAgJiBkb3duXG4gICAgdGhpcy5pbnB1dEtleURvd24kLnBpcGUoZmlsdGVyKFxuICAgICAgZSA9PiBpc0Fycm93VXBEb3duKGUua2V5Q29kZSlcbiAgICApKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLm9uRm9jdXNJdGVtKGUpO1xuICAgIH0pO1xuXG4gICAgLy8gZW50ZXIga2V5dXBcbiAgICB0aGlzLmlucHV0S2V5VXAkLnBpcGUoZmlsdGVyKGUgPT4gaXNFbnRlcihlLmtleUNvZGUpKSkuc3Vic2NyaWJlKGUgPT4ge1xuICAgICAgLy90aGlzLm9uSGFuZGxlRW50ZXIoKTtcbiAgICB9KTtcblxuICAgIC8vIGVudGVyIGtleWRvd25cbiAgICB0aGlzLmlucHV0S2V5RG93biQucGlwZShmaWx0ZXIoZSA9PiBpc0VudGVyKGUua2V5Q29kZSkpKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICB0aGlzLm9uSGFuZGxlRW50ZXIoKTtcbiAgICB9KTtcblxuICAgIC8vIEVTQ1xuICAgIHRoaXMuaW5wdXRLZXlVcCQucGlwZShcbiAgICAgIGZpbHRlcihlID0+IGlzRVNDKGUua2V5Q29kZSksXG4gICAgICAgIGRlYm91bmNlVGltZSgxMDApKVxuICAgICkuc3Vic2NyaWJlKGUgPT4ge1xuICAgICAgdGhpcy5vbkVzYygpO1xuICAgIH0pO1xuXG4gICAgLy8gVEFCXG4gICAgdGhpcy5pbnB1dEtleURvd24kLnBpcGUoXG4gICAgICBmaWx0ZXIoZSA9PiBpc1RhYihlLmtleUNvZGUpKVxuICAgICkuc3Vic2NyaWJlKGUgPT4ge1xuICAgICAgdGhpcy5vblRhYigpO1xuICAgIH0pO1xuXG4gICAgLy8gZGVsZXRlXG4gICAgdGhpcy5pbnB1dEtleURvd24kLnBpcGUoXG4gICAgICBmaWx0ZXIoZSA9PiBpc0JhY2tzcGFjZShlLmtleUNvZGUpIHx8IGlzRGVsZXRlKGUua2V5Q29kZSkpXG4gICAgKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICB0aGlzLm9uRGVsZXRlKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogb24ga2V5dXAgPT0gd2hlbiBpbnB1dCBjaGFuZ2VkXG4gICAqIEBwYXJhbSBlIGV2ZW50XG4gICAqL1xuICBvbktleVVwKGUpIHtcbiAgICB0aGlzLm5vdEZvdW5kID0gZmFsc2U7IC8vIHNlYXJjaCByZXN1bHRzIGFyZSB1bmtub3duIHdoaWxlIHR5cGluZ1xuICAgIC8vIGlmIGlucHV0IGlzIGVtcHR5XG4gICAgaWYgKCF0aGlzLnF1ZXJ5KSB7XG4gICAgICB0aGlzLm5vdEZvdW5kID0gZmFsc2U7XG4gICAgICB0aGlzLmlucHV0Q2hhbmdlZC5lbWl0KGUudGFyZ2V0LnZhbHVlKTtcbiAgICAgIHRoaXMuaW5wdXRDbGVhcmVkLmVtaXQoKTtcbiAgICAgIHRoaXMuc2V0UGFuZWxTdGF0ZShlKTtcbiAgICB9XG4gICAgLy8gbm90ZSB0aGF0ICcnIGNhbiBiZSBhIHZhbGlkIHF1ZXJ5XG4gICAgaWYgKCF0aGlzLnF1ZXJ5ICYmIHRoaXMucXVlcnkgIT09ICcnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGlmIHF1ZXJ5ID49IHRvIG1pblF1ZXJ5TGVuZ3RoXG4gICAgaWYgKHRoaXMucXVlcnkubGVuZ3RoID49IHRoaXMubWluUXVlcnlMZW5ndGgpIHtcbiAgICAgIHRoaXMuaW5wdXRDaGFuZ2VkLmVtaXQoZS50YXJnZXQudmFsdWUpO1xuICAgICAgdGhpcy5maWx0ZXJMaXN0KCk7XG5cbiAgICAgIC8vIElmIG5vIHJlc3VsdHMgZm91bmRcbiAgICAgIGlmICghdGhpcy5maWx0ZXJlZExpc3QubGVuZ3RoICYmICF0aGlzLmlzTG9hZGluZykge1xuICAgICAgICB0aGlzLm5vdEZvdW5kVGV4dCA/IHRoaXMubm90Rm91bmQgPSB0cnVlIDogdGhpcy5ub3RGb3VuZCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5kYXRhICYmICF0aGlzLmRhdGEubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIC8qKlxuICAgKiBLZXlib2FyZCBhcnJvdyB0b3AgYW5kIGFycm93IGJvdHRvbVxuICAgKiBAcGFyYW0gZSBldmVudFxuICAgKi9cbiAgb25Gb2N1c0l0ZW0oZSkge1xuICAgIC8vIG1vdmUgYXJyb3cgdXAgYW5kIGRvd24gb24gZmlsdGVyZWRMaXN0IG9yIGhpc3RvcnlMaXN0XG4gICAgaWYgKCF0aGlzLmhpc3RvcnlMaXN0Lmxlbmd0aCB8fCAhdGhpcy5pc0hpc3RvcnlMaXN0VmlzaWJsZSkge1xuICAgICAgLy8gZmlsdGVyZWRMaXN0XG4gICAgICBjb25zdCB0b3RhbE51bUl0ZW0gPSB0aGlzLmZpbHRlcmVkTGlzdC5sZW5ndGg7XG4gICAgICBpZiAoZS5rZXkgPT09ICdBcnJvd0Rvd24nKSB7XG4gICAgICAgIGxldCBzdW0gPSB0aGlzLnNlbGVjdGVkSWR4O1xuICAgICAgICBzdW0gPSAodGhpcy5zZWxlY3RlZElkeCA9PT0gbnVsbCkgPyAwIDogc3VtICsgMTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZElkeCA9ICh0b3RhbE51bUl0ZW0gKyBzdW0pICUgdG90YWxOdW1JdGVtO1xuICAgICAgICB0aGlzLnNjcm9sbFRvRm9jdXNlZEl0ZW0odGhpcy5zZWxlY3RlZElkeCk7XG4gICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAnQXJyb3dVcCcpIHtcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRJZHggPT0gLTEpIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdGVkSWR4ID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNlbGVjdGVkSWR4ID0gKHRvdGFsTnVtSXRlbSArIHRoaXMuc2VsZWN0ZWRJZHggLSAxKSAlIHRvdGFsTnVtSXRlbTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb0ZvY3VzZWRJdGVtKHRoaXMuc2VsZWN0ZWRJZHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBoaXN0b3J5TGlzdFxuICAgICAgY29uc3QgdG90YWxOdW1JdGVtID0gdGhpcy5oaXN0b3J5TGlzdC5sZW5ndGg7XG4gICAgICBpZiAoZS5rZXkgPT09ICdBcnJvd0Rvd24nKSB7XG4gICAgICAgIGxldCBzdW0gPSB0aGlzLnNlbGVjdGVkSWR4O1xuICAgICAgICBzdW0gPSAodGhpcy5zZWxlY3RlZElkeCA9PT0gbnVsbCkgPyAwIDogc3VtICsgMTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZElkeCA9ICh0b3RhbE51bUl0ZW0gKyBzdW0pICUgdG90YWxOdW1JdGVtO1xuICAgICAgICB0aGlzLnNjcm9sbFRvRm9jdXNlZEl0ZW0odGhpcy5zZWxlY3RlZElkeCk7XG4gICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAnQXJyb3dVcCcpIHtcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRJZHggPT0gLTEpIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdGVkSWR4ID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNlbGVjdGVkSWR4ID0gKHRvdGFsTnVtSXRlbSArIHRoaXMuc2VsZWN0ZWRJZHggLSAxKSAlIHRvdGFsTnVtSXRlbTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb0ZvY3VzZWRJdGVtKHRoaXMuc2VsZWN0ZWRJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGwgdG8gZm9jdXNlZCBpdGVtXG4gICAqICogQHBhcmFtIGluZGV4XG4gICAqL1xuICBzY3JvbGxUb0ZvY3VzZWRJdGVtKGluZGV4KSB7XG4gICAgbGV0IGxpc3RFbGVtZW50ID0gbnVsbDtcbiAgICAvLyBEZWZpbmUgbGlzdCBlbGVtZW50XG4gICAgaWYgKCF0aGlzLmhpc3RvcnlMaXN0Lmxlbmd0aCB8fCAhdGhpcy5pc0hpc3RvcnlMaXN0VmlzaWJsZSkge1xuICAgICAgLy8gZmlsdGVyZWRMaXN0IGVsZW1lbnRcbiAgICAgIGxpc3RFbGVtZW50ID0gdGhpcy5maWx0ZXJlZExpc3RFbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGhpc3RvcnlMaXN0IGVsZW1lbnRcbiAgICAgIGxpc3RFbGVtZW50ID0gdGhpcy5oaXN0b3J5TGlzdEVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGxpc3RFbGVtZW50LmNoaWxkTm9kZXMpLmZpbHRlcigobm9kZTogYW55KSA9PiB7XG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICAvLyBpZiBub2RlIGlzIGVsZW1lbnRcbiAgICAgICAgcmV0dXJuIG5vZGUuY2xhc3NOYW1lLmluY2x1ZGVzKCdpdGVtJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWl0ZW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxpc3RIZWlnaHQgPSBsaXN0RWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgY29uc3QgaXRlbUhlaWdodCA9IGl0ZW1zW2luZGV4XS5vZmZzZXRIZWlnaHQ7XG4gICAgY29uc3QgdmlzaWJsZVRvcCA9IGxpc3RFbGVtZW50LnNjcm9sbFRvcDtcbiAgICBjb25zdCB2aXNpYmxlQm90dG9tID0gbGlzdEVsZW1lbnQuc2Nyb2xsVG9wICsgbGlzdEhlaWdodCAtIGl0ZW1IZWlnaHQ7XG4gICAgY29uc3QgdGFyZ2V0UG9zaXRpb24gPSBpdGVtc1tpbmRleF0ub2Zmc2V0VG9wO1xuXG4gICAgaWYgKHRhcmdldFBvc2l0aW9uIDwgdmlzaWJsZVRvcCkge1xuICAgICAgbGlzdEVsZW1lbnQuc2Nyb2xsVG9wID0gdGFyZ2V0UG9zaXRpb247XG4gICAgfVxuXG4gICAgaWYgKHRhcmdldFBvc2l0aW9uID4gdmlzaWJsZUJvdHRvbSkge1xuICAgICAgbGlzdEVsZW1lbnQuc2Nyb2xsVG9wID0gdGFyZ2V0UG9zaXRpb24gLSBsaXN0SGVpZ2h0ICsgaXRlbUhlaWdodDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VsZWN0IGl0ZW0gb24gZW50ZXIgY2xpY2tcbiAgICovXG4gIG9uSGFuZGxlRW50ZXIoKSB7XG4gICAgLy8gY2xpY2sgZW50ZXIgdG8gY2hvb3NlIGl0ZW0gZnJvbSBmaWx0ZXJlZExpc3Qgb3IgaGlzdG9yeUxpc3RcbiAgICBpZiAodGhpcy5zZWxlY3RlZElkeCA+IC0xKSB7XG4gICAgICBpZiAoIXRoaXMuaGlzdG9yeUxpc3QubGVuZ3RoIHx8ICF0aGlzLmlzSGlzdG9yeUxpc3RWaXNpYmxlKSB7XG4gICAgICAgIC8vIGZpbHRlcmVkTGlzdFxuICAgICAgICB0aGlzLnF1ZXJ5ID0gIXRoaXMuaXNUeXBlU3RyaW5nKHRoaXMuZmlsdGVyZWRMaXN0W3RoaXMuc2VsZWN0ZWRJZHhdKVxuICAgICAgICAgID8gdGhpcy5maWx0ZXJlZExpc3RbdGhpcy5zZWxlY3RlZElkeF1bdGhpcy5zZWFyY2hLZXl3b3JkXVxuICAgICAgICAgIDogdGhpcy5maWx0ZXJlZExpc3RbdGhpcy5zZWxlY3RlZElkeF07XG5cbiAgICAgICAgdGhpcy5zYXZlSGlzdG9yeSh0aGlzLmZpbHRlcmVkTGlzdFt0aGlzLnNlbGVjdGVkSWR4XSk7XG4gICAgICAgIHRoaXMuc2VsZWN0KHRoaXMuZmlsdGVyZWRMaXN0W3RoaXMuc2VsZWN0ZWRJZHhdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGhpc3RvcnlMaXN0XG4gICAgICAgIHRoaXMucXVlcnkgPSAhdGhpcy5pc1R5cGVTdHJpbmcodGhpcy5oaXN0b3J5TGlzdFt0aGlzLnNlbGVjdGVkSWR4XSlcbiAgICAgICAgICA/IHRoaXMuaGlzdG9yeUxpc3RbdGhpcy5zZWxlY3RlZElkeF1bdGhpcy5zZWFyY2hLZXl3b3JkXVxuICAgICAgICAgIDogdGhpcy5oaXN0b3J5TGlzdFt0aGlzLnNlbGVjdGVkSWR4XTtcbiAgICAgICAgdGhpcy5zYXZlSGlzdG9yeSh0aGlzLmhpc3RvcnlMaXN0W3RoaXMuc2VsZWN0ZWRJZHhdKTtcbiAgICAgICAgdGhpcy5zZWxlY3QodGhpcy5oaXN0b3J5TGlzdFt0aGlzLnNlbGVjdGVkSWR4XSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaXNIaXN0b3J5TGlzdFZpc2libGUgPSBmYWxzZTtcbiAgICB0aGlzLmhhbmRsZUNsb3NlKCk7XG4gIH1cblxuICAvKipcbiAgICogRXNjIGNsaWNrXG4gICAqL1xuICBvbkVzYygpIHtcbiAgICB0aGlzLnNlYXJjaElucHV0Lm5hdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgIHRoaXMuaGFuZGxlQ2xvc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWIgY2xpY2tcbiAgICovXG4gIG9uVGFiKCkge1xuICAgIHRoaXMuc2VhcmNoSW5wdXQubmF0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgdGhpcy5oYW5kbGVDbG9zZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBjbGlja1xuICAgKi9cbiAgb25EZWxldGUoKSB7XG4gICAgdGhpcy5pc09wZW4gPSB0cnVlO1xuICB9XG5cblxuICAvKipcbiAgICogU2VsZWN0IGl0ZW0gdG8gc2F2ZSBpbiBsb2NhbFN0b3JhZ2VcbiAgICogQHBhcmFtIHNlbGVjdGVkXG4gICAqL1xuICBzYXZlSGlzdG9yeShzZWxlY3RlZCkge1xuICAgIGlmICh0aGlzLmhpc3RvcnlJZGVudGlmaWVyKSB7XG4gICAgICAvLyBjaGVjayBpZiBzZWxlY3RlZCBpdGVtIGV4aXN0cyBpbiBoaXN0b3J5TGlzdFxuICAgICAgaWYgKCF0aGlzLmhpc3RvcnlMaXN0LnNvbWUoKGl0ZW0pID0+ICF0aGlzLmlzVHlwZVN0cmluZyhpdGVtKVxuICAgICAgICA/IGl0ZW1bdGhpcy5zZWFyY2hLZXl3b3JkXSA9PSBzZWxlY3RlZFt0aGlzLnNlYXJjaEtleXdvcmRdIDogaXRlbSA9PSBzZWxlY3RlZCkpIHtcbiAgICAgICAgdGhpcy5zYXZlSGlzdG9yeVRvTG9jYWxTdG9yYWdlKFtzZWxlY3RlZCwgLi4udGhpcy5oaXN0b3J5TGlzdF0pO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIGl0ZW1zIGRvbid0IGV4Y2VlZCBtYXggYWxsb3dlZCBudW1iZXJcbiAgICAgICAgaWYgKHRoaXMuaGlzdG9yeUxpc3QubGVuZ3RoID49IHRoaXMuaGlzdG9yeUxpc3RNYXhOdW1iZXIpIHtcbiAgICAgICAgICB0aGlzLmhpc3RvcnlMaXN0LnNwbGljZSh0aGlzLmhpc3RvcnlMaXN0Lmxlbmd0aCAtIDEsIDEpO1xuICAgICAgICAgIHRoaXMuc2F2ZUhpc3RvcnlUb0xvY2FsU3RvcmFnZShbc2VsZWN0ZWQsIC4uLnRoaXMuaGlzdG9yeUxpc3RdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaWYgc2VsZWN0ZWQgaXRlbSBleGlzdHMgaW4gaGlzdG9yeUxpc3Qgc3dhcCB0byB0b3AgaW4gYXJyYXlcbiAgICAgICAgaWYgKCF0aGlzLmlzVHlwZVN0cmluZyhzZWxlY3RlZCkpIHtcbiAgICAgICAgICAvLyBvYmplY3QgbG9naWNcbiAgICAgICAgICBjb25zdCBjb3BpZWRIaXN0b3J5TGlzdCA9IHRoaXMuaGlzdG9yeUxpc3Quc2xpY2UoKTsgLy8gY29weSBvcmlnaW5hbCBoaXN0b3J5TGlzdCBhcnJheVxuICAgICAgICAgIGNvbnN0IHNlbGVjdGVkSW5kZXggPSBjb3BpZWRIaXN0b3J5TGlzdC5tYXAoKGl0ZW0pID0+IGl0ZW1bdGhpcy5zZWFyY2hLZXl3b3JkXSkuaW5kZXhPZihzZWxlY3RlZFt0aGlzLnNlYXJjaEtleXdvcmRdKTtcbiAgICAgICAgICBjb3BpZWRIaXN0b3J5TGlzdC5zcGxpY2Uoc2VsZWN0ZWRJbmRleCwgMSk7XG4gICAgICAgICAgY29waWVkSGlzdG9yeUxpc3Quc3BsaWNlKDAsIDAsIHNlbGVjdGVkKTtcbiAgICAgICAgICB0aGlzLnNhdmVIaXN0b3J5VG9Mb2NhbFN0b3JhZ2UoWy4uLmNvcGllZEhpc3RvcnlMaXN0XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc3RyaW5nIGxvZ2ljXG4gICAgICAgICAgY29uc3QgY29waWVkSGlzdG9yeUxpc3QgPSB0aGlzLmhpc3RvcnlMaXN0LnNsaWNlKCk7IC8vIGNvcHkgb3JpZ2luYWwgaGlzdG9yeUxpc3QgYXJyYXlcbiAgICAgICAgICBjb3BpZWRIaXN0b3J5TGlzdC5zcGxpY2UodGhpcy5oaXN0b3J5TGlzdC5pbmRleE9mKHNlbGVjdGVkKSwgMSk7XG4gICAgICAgICAgY29waWVkSGlzdG9yeUxpc3Quc3BsaWNlKDAsIDAsIHNlbGVjdGVkKTtcbiAgICAgICAgICB0aGlzLnNhdmVIaXN0b3J5VG9Mb2NhbFN0b3JhZ2UoWy4uLmNvcGllZEhpc3RvcnlMaXN0XSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2F2ZSBpdGVtIGluIGxvY2FsU3RvcmFnZVxuICAgKiBAcGFyYW0gc2VsZWN0ZWRcbiAgICovXG4gIHNhdmVIaXN0b3J5VG9Mb2NhbFN0b3JhZ2Uoc2VsZWN0ZWQpIHtcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oXG4gICAgICBgJHt0aGlzLmhpc3RvcnlJZGVudGlmaWVyfWAsXG4gICAgICBKU09OLnN0cmluZ2lmeShzZWxlY3RlZClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBpdGVtIGZyb20gbG9jYWxTdG9yYWdlXG4gICAqIEBwYXJhbSBpbmRleFxuICAgKiBAcGFyYW0gZSBldmVudFxuICAgKi9cbiAgcmVtb3ZlSGlzdG9yeUl0ZW0oaW5kZXgsIGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMuaGlzdG9yeUxpc3QgPSB0aGlzLmhpc3RvcnlMaXN0LmZpbHRlcigodiwgaSkgPT4gaSAhPT0gaW5kZXgpO1xuICAgIHRoaXMuc2F2ZUhpc3RvcnlUb0xvY2FsU3RvcmFnZSh0aGlzLmhpc3RvcnlMaXN0KTtcbiAgICBpZiAodGhpcy5oaXN0b3J5TGlzdC5sZW5ndGggPT0gMCkge1xuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGAke3RoaXMuaGlzdG9yeUlkZW50aWZpZXJ9YCk7XG4gICAgICB0aGlzLmZpbHRlckxpc3QoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgbG9jYWxTdG9yYWdlXG4gICAqIEBwYXJhbSBlIGV2ZW50XG4gICAqL1xuICByZXNldEhpc3RvcnlMaXN0KGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMuaGlzdG9yeUxpc3QgPSBbXTtcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oYCR7dGhpcy5oaXN0b3J5SWRlbnRpZmllcn1gKTtcbiAgICB0aGlzLmZpbHRlckxpc3QoKTtcbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cImF1dG9jb21wbGV0ZS1jb250YWluZXJcIiBhcmlhLW93bnM9XCJzdWdnZXN0aW9ucyBzdWdnZXN0aW9ucy1oaXN0b3J5XCIgW2F0dHIuYXJpYS1leHBhbmRlZF09XCJpc09wZW5cIlxuICAgICBbbmdDbGFzc109XCJ7ICdhY3RpdmUnOiBpc09wZW59XCI+XG4gIDxkaXYgY2xhc3M9XCJpbnB1dC1jb250YWluZXJcIj5cbiAgICA8aW5wdXQgI3NlYXJjaElucHV0XG4gICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgYXR0ci5hcmlhLWxhYmVsPVwie3twbGFjZWhvbGRlcn19XCJcbiAgICAgICAgICAgYXJpYS1hdXRvY29tcGxldGU9XCJsaXN0XCJcbiAgICAgICAgICAgcm9sZT1cImNvbWJvYm94XCJcbiAgICAgICAgICAgcGxhY2Vob2xkZXI9e3twbGFjZWhvbGRlcn19XG4gICAgICAgICAgIFsobmdNb2RlbCldPXF1ZXJ5XG4gICAgICAgICAgIChpbnB1dCk9XCJvbkNoYW5nZSgkZXZlbnQpXCJcbiAgICAgICAgICAgKGZvY3VzKT1oYW5kbGVGb2N1cygkZXZlbnQpXG4gICAgICAgICAgIChibHVyKT1vblRvdWNoZWQoJGV2ZW50KVxuICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIlxuICAgICAgICAgICBhdXRvY29tcGxldGU9XCJvZmZcIj5cbiAgICA8ZGl2IGNsYXNzPVwieFwiICpuZ0lmPVwicXVlcnkgJiYgIWlzTG9hZGluZyAmJiAhZGlzYWJsZWRcIiAoY2xpY2spPVwicmVtb3ZlKCRldmVudClcIj5cbiAgICAgIDxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIiBhcmlhLWxhYmVsPVwiQ2xvc2VcIj5jbG9zZTwvaT5cbiAgICA8L2Rpdj5cbiAgICA8IS0tTG9hZGluZyBtYXNrLS0+XG4gICAgPGRpdiBjbGFzcz1cInNrLWZhZGluZy1jaXJjbGVcIiAqbmdJZj1cImlzTG9hZGluZ1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInNrLWNpcmNsZTEgc2stY2lyY2xlXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic2stY2lyY2xlMiBzay1jaXJjbGVcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzay1jaXJjbGUzIHNrLWNpcmNsZVwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInNrLWNpcmNsZTQgc2stY2lyY2xlXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic2stY2lyY2xlNSBzay1jaXJjbGVcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzay1jaXJjbGU2IHNrLWNpcmNsZVwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInNrLWNpcmNsZTcgc2stY2lyY2xlXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic2stY2lyY2xlOCBzay1jaXJjbGVcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzay1jaXJjbGU5IHNrLWNpcmNsZVwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInNrLWNpcmNsZTEwIHNrLWNpcmNsZVwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInNrLWNpcmNsZTExIHNrLWNpcmNsZVwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInNrLWNpcmNsZTEyIHNrLWNpcmNsZVwiPjwvZGl2PlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cblxuICA8IS0tRmlsdGVyZWRMaXN0IGl0ZW1zLS0+XG4gIDxkaXYgY2xhc3M9XCJzdWdnZXN0aW9ucy1jb250YWluZXJcIiBpZD1cInN1Z2dlc3Rpb25zXCIgcm9sZT1cImxpc3Rib3hcIlxuICAgICAgIFtuZ0NsYXNzXT1cInsgJ2lzLWhpZGRlbic6IGlzSGlzdG9yeUxpc3RWaXNpYmxlLCAnaXMtdmlzaWJsZSc6ICFpc0hpc3RvcnlMaXN0VmlzaWJsZX1cIj5cbiAgICA8IS0tRmlsdGVyZWRMaXN0IGhlYWRpbmctLT5cbiAgICA8ZGl2IGNsYXNzPVwiaGVhZGluZ1wiICpuZ0lmPVwiZmlsdGVyZWRMaXN0Lmxlbmd0aCA+IDAgJiYgaGVhZGluZ1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInRleHRcIj57e2hlYWRpbmd9fTwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPHVsICNmaWx0ZXJlZExpc3RFbGVtZW50PlxuICAgICAgPGxpICpuZ0Zvcj1cImxldCBpdGVtIG9mIGZpbHRlcmVkTGlzdDsgbGV0IGlkeCA9IGluZGV4XCIgY2xhc3M9XCJpdGVtXCI+XG4gICAgICAgIDwhLS1zdHJpbmcgbG9naWMtLT5cbiAgICAgICAgPGRpdiBbY2xhc3MuY29tcGxldGUtc2VsZWN0ZWRdPVwiaWR4ID09PSBzZWxlY3RlZElkeFwiICpuZ0lmPSdpc1R5cGVTdHJpbmcoaXRlbSknXG4gICAgICAgICAgICAgKGNsaWNrKT1cInNlbGVjdChpdGVtKVwiPlxuICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiaXRlbVRlbXBsYXRlOyAgY29udGV4dDogeyAkaW1wbGljaXQ6IGl0ZW0gfCBoaWdobGlnaHQ6IHRvSGlnaGxpZ2h0IH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDwhLS1vYmplY3QgbG9naWMtLT5cbiAgICAgICAgPGRpdiBbY2xhc3MuY29tcGxldGUtc2VsZWN0ZWRdPVwiaWR4ID09PSBzZWxlY3RlZElkeFwiICpuZ0lmPSchaXNUeXBlU3RyaW5nKGl0ZW0pJ1xuICAgICAgICAgICAgIChjbGljayk9XCJzZWxlY3QoaXRlbSlcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cIml0ZW1UZW1wbGF0ZTsgY29udGV4dDogeyAkaW1wbGljaXQ6IGl0ZW0gfCBoaWdobGlnaHQ6IHRvSGlnaGxpZ2h0IDogc2VhcmNoS2V5d29yZCB9XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9saT5cbiAgICA8L3VsPlxuICA8L2Rpdj5cblxuICA8IS0tSGlzdG9yeUxpc3QgaXRlbXMtLT5cbiAgPGRpdiBjbGFzcz1cInN1Z2dlc3Rpb25zLWNvbnRhaW5lclwiIGlkPVwic3VnZ2VzdGlvbnMtaGlzdG9yeVwiIHJvbGU9XCJsaXN0Ym94XCJcbiAgICAgICBbbmdDbGFzc109XCJ7ICdpcy1oaWRkZW4nOiAhaXNIaXN0b3J5TGlzdFZpc2libGUsICdpcy12aXNpYmxlJzogaXNIaXN0b3J5TGlzdFZpc2libGV9XCI+XG4gICAgPCEtLUhpc3RvcnlMaXN0IGhlYWRpbmctLT5cbiAgICA8ZGl2IGNsYXNzPVwiaGVhZGluZ1wiICpuZ0lmPVwiaGlzdG9yeUxpc3QubGVuZ3RoID4gMCAmJiBoaXN0b3J5SGVhZGluZ1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInRleHRcIj57e2hpc3RvcnlIZWFkaW5nfX08L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ4XCIgKGNsaWNrKT1cInJlc2V0SGlzdG9yeUxpc3QoJGV2ZW50KVwiPlxuICAgICAgICA8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCIgYXJpYS1sYWJlbD1cIkRlbGV0ZVwiPmRlbGV0ZTwvaT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPHVsICNoaXN0b3J5TGlzdEVsZW1lbnQ+XG4gICAgICA8bGkgKm5nRm9yPVwibGV0IGl0ZW0gb2YgaGlzdG9yeUxpc3Q7IGxldCBpZHggPSBpbmRleFwiIGNsYXNzPVwiaXRlbVwiPlxuICAgICAgICA8IS0tc3RyaW5nIGxvZ2ljLS0+XG4gICAgICAgIDxkaXYgW2NsYXNzLmNvbXBsZXRlLXNlbGVjdGVkXT1cImlkeCA9PT0gc2VsZWN0ZWRJZHhcIiAqbmdJZj0naXNUeXBlU3RyaW5nKGl0ZW0pJyAoY2xpY2spPVwic2VsZWN0KGl0ZW0pXCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJpdGVtVGVtcGxhdGU7ICBjb250ZXh0OiB7ICRpbXBsaWNpdDogaXRlbSB9XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8IS0tb2JqZWN0IGxvZ2ljLS0+XG4gICAgICAgIDxkaXYgW2NsYXNzLmNvbXBsZXRlLXNlbGVjdGVkXT1cImlkeCA9PT0gc2VsZWN0ZWRJZHhcIiAqbmdJZj0nIWlzVHlwZVN0cmluZyhpdGVtKScgKGNsaWNrKT1cInNlbGVjdChpdGVtKVwiPlxuICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiaXRlbVRlbXBsYXRlOyBjb250ZXh0OiB7ICRpbXBsaWNpdDogaXRlbSB9XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwieFwiIChjbGljayk9XCJyZW1vdmVIaXN0b3J5SXRlbShpZHgsICRldmVudClcIj5cbiAgICAgICAgICA8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCIgYXJpYS1sYWJlbD1cIkNsb3NlXCI+Y2xvc2U8L2k+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9saT5cbiAgICA8L3VsPlxuICA8L2Rpdj5cblxuICA8IS0tTm90IGZvdW5kLS0+XG4gIDxkaXYgY2xhc3M9XCJub3QtZm91bmRcIiAqbmdJZj1cImlzTG9hZGluZyA/ICFpc0xvYWRpbmcgJiYgbm90Rm91bmQgOiBub3RGb3VuZFwiPlxuICAgIDxuZy1jb250YWluZXJcbiAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwibm90Rm91bmRUZW1wbGF0ZTsgIGNvbnRleHQ6IHsgJGltcGxpY2l0OiBub3RGb3VuZFRleHQgIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG48L2Rpdj5cbjxkaXYgY2xhc3M9XCJhdXRvY29tcGxldGUtb3ZlcmxheVwiICpuZ0lmPVwib3ZlcmxheVwiIChjbGljayk9XCJoYW5kbGVPdmVybGF5KClcIj48L2Rpdj5cbiJdfQ==
import {Component, OnInit, Output, EventEmitter, Inject, effect} from '@angular/core';
import {NavService, Menu} from '../../services/nav.service';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {CommonModule, DOCUMENT} from '@angular/common';
import {FeatherIconsComponent} from '../feather-icons/feather-icons.component';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {AuthService} from "../../services/auth.service";
import {User} from '@angular/fire/auth'
import {Observable, toArray} from "rxjs";
import {map} from "rxjs/operators";

var body = document.getElementsByTagName("body")[0];

/**
 * Class representing the HeaderComponent for the application.
 * This component is responsible for rendering the header section of the application,
 * including the navigation menu, search functionality, language selector, and user authentication controls.
 * HeaderComponent implements OnInit lifecycle hook to handle initialization logic.
 *
 * @Component({
 *   selector: 'app-header',
 *   standalone: true,
 *   imports: [CommonModule, FeatherIconsComponent, FormsModule, RouterModule, TranslateModule],
 *   providers: [TranslateService],
 *   templateUrl: './header.component.html',
 *   styleUrls: ['./header.component.scss']
 * })
 */
@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, FeatherIconsComponent, FormsModule, RouterModule, TranslateModule],
    providers: [TranslateService],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

    public menuItems: Menu[];
    public items: Menu[];
    public searchResult: boolean = false;
    public searchResultEmpty: boolean = false;
    public openNav: boolean = false
    public right_sidebar: boolean = false
    public text: string;
    public elem: any;
    public isOpenMobile: boolean = false
    @Output() rightSidebarEvent = new EventEmitter<boolean>();
    protected isLoggedin: boolean
    protected currentUser: User
    private currentDate = new Date()
    private currentGames: Observable<any[]>;

    constructor(
        protected auth: AuthService,
        public navServices: NavService,
        // private nflService: NflDataService,
        @Inject(DOCUMENT) private document: any,
        private translate: TranslateService) {
    }

    /**
     * Signs out the user from the current session.
     *
     * @return {Promise<void>} A promise that resolves once the user is successfully signed out.
     */
    async SignOut() {
        await this.auth.logout();
    }

    /**
     * Performs cleanup when the component is destroyed.
     * This method should be used to perform any necessary cleanup operations before the component is removed from the DOM.
     *
     * @return {void}
     */
    ngOnDestroy() {
        this.removeFix();
    }

    /**
     * Represents the right sidebar element in the user interface.
     * This element is responsible for displaying content on the right side of the screen.
     * @return {void} - This method toggles the visibility of the right sidebar element and emits an event to notify listeners.
     */
    right_side_bar() {
        /**
         * Represents the right sidebar element in the user interface.
         * This element is responsible for displaying content on the right side of the screen.
         */
        this.right_sidebar = !this.right_sidebar
        this.rightSidebarEvent.emit(this.right_sidebar)
    }

    /**
     * Toggles the sidebar collapse state.
     *
     * @return {void}
     */
    collapseSidebar() {
        this.navServices.collapseSidebar = !this.navServices.collapseSidebar
    }

    /**
     * Toggles the visibility of the mobile navigation menu.
     *
     * @return {void}
     */
    openMobileNav() {
        this.openNav = !this.openNav;
    }

    /**
     * Change the language of the application.
     *
     * @param lang The new language to switch to.
     *
     * @return {void}
     */
    public changeLanguage(lang: any) {
        this.translate.use(lang)
    }

    /**
     * Search for a term in the menu items and filter the results accordingly.
     * @param {any} term - The term to search for in the menu items.
     * @return {void}
     */
    searchTerm(term: any) {
        term ? this.addFix() : this.removeFix();
        if (!term) return this.menuItems = [];
        let items: any = [];
        term = term.toLowerCase();
        this.items.filter((menuItems: any) => {
            if (menuItems.title.toLowerCase().includes(term) && menuItems.type === 'link') {
                items.push(menuItems);
            }
            if (!menuItems.children) return false
            menuItems.children.filter((subItems: any) => {
                if (subItems.title.toLowerCase().includes(term) && subItems.type === 'link') {
                    subItems.icon = menuItems.icon
                    items.push(subItems);
                }
                if (!subItems.children) return false
                subItems.children.filter((suSubItems: any) => {
                    if (suSubItems.title.toLowerCase().includes(term)) {
                        suSubItems.icon = menuItems.icon
                        items.push(suSubItems);
                    }
                })
                return
            })
            this.checkSearchResultEmpty(items)
            this.menuItems = items
            return
        });
        return
    }

    /**
     * Checks if the search result is empty based on the provided items array.
     *
     * @param {Array} items - The array of items to check for emptiness.
     * @return {void} - Does not return anything. Updates the 'searchResultEmpty' property of the instance.
     */
    checkSearchResultEmpty(items: any) {
        if (!items.length)
            this.searchResultEmpty = true;
        else
            this.searchResultEmpty = false;
    }

    /**
     * Set searchResult property to true and add class "offcanvas" to body element
     * @return {void}
     */
    addFix() {
        this.searchResult = true;
        body.classList.add("offcanvas");
    }

    /**
     * Removes the fix applied by the method, setting search result to false, removing 'offcanvas' class from body element,
     * and resetting text to an empty string.
     *
     * @return {void}
     */
    removeFix() {
        this.searchResult = false;
        body.classList.remove("offcanvas");
        this.text = "";
    }

    /**
     * Initializes the component by subscribing to menu items.
     *
     * @returns {void}
     */
    ngOnInit() {
        this.elem = document.documentElement;
        this.navServices.items.subscribe(menuItems => {
            this.items = menuItems
        });
    }


    /**
     * Toggles the fullscreen mode of the current element.
     *
     * @return {void}
     */
    toggleFullScreen() {
        this.navServices.fullScreen = !this.navServices.fullScreen;
        if (this.navServices.fullScreen) {
            if (this.elem.requestFullscreen) {
                this.elem.requestFullscreen();
            } else if (this.elem.mozRequestFullScreen) {
                /* Firefox */
                this.elem.mozRequestFullScreen();
            } else if (this.elem.webkitRequestFullscreen) {
                /* Chrome, Safari and Opera */
                this.elem.webkitRequestFullscreen();
            } else if (this.elem.msRequestFullscreen) {
                /* IE/Edge */
                this.elem.msRequestFullscreen();
            }
        } else {
            if (!this.document.exitFullscreen) {
                this.document.exitFullscreen();
            } else if (this.document.mozCancelFullScreen) {
                /* Firefox */
                this.document.mozCancelFullScreen();
            } else if (this.document.webkitExitFullscreen) {
                /* Chrome, Safari and Opera */
                this.document.webkitExitFullscreen();
            } else if (this.document.msExitFullscreen) {
                /* IE/Edge */
                this.document.msExitFullscreen();
            }
        }
    }
}

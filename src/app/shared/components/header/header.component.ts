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
import {NflDataService} from "../../services/nfl-data.service";
import {map} from "rxjs/operators";

var body = document.getElementsByTagName("body")[0];

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
        private auth: AuthService,
        public navServices: NavService,
        private nflService: NflDataService,
        @Inject(DOCUMENT) private document: any,
        private translate: TranslateService) {
        effect(() => {
            this.isLoggedin = this.auth.isLoggedIn();
            this.currentUser = this.auth.currentUser();
        });


    }




    ngOnDestroy() {
        this.removeFix();
    }


    right_side_bar() {
        this.right_sidebar = !this.right_sidebar
        this.rightSidebarEvent.emit(this.right_sidebar)
    }

    collapseSidebar() {
        this.navServices.collapseSidebar = !this.navServices.collapseSidebar
    }

    openMobileNav() {
        this.openNav = !this.openNav;
    }

    public changeLanguage(lang: any) {
        this.translate.use(lang)
    }

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

    checkSearchResultEmpty(items: any) {
        if (!items.length)
            this.searchResultEmpty = true;
        else
            this.searchResultEmpty = false;
    }

    addFix() {
        this.searchResult = true;
        body.classList.add("offcanvas");
    }

    removeFix() {
        this.searchResult = false;
        body.classList.remove("offcanvas");
        this.text = "";
    }

    ngOnInit() {
        this.elem = document.documentElement;
        this.navServices.items.subscribe(menuItems => {
            this.items = menuItems
        });
    }

    async SignOut() {
        await this.auth.logout()
    }

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

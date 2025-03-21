import {Injectable, HostListener} from '@angular/core';
import {BehaviorSubject, Observable, Subscriber} from 'rxjs';
import navItems from '../../../assets/dashboard.json'

// Menu
export interface Menu {
    path?: string;
    title?: string;
    icon?: string;
    type?: string;
    badgeType?: string;
    badgeValue?: string;
    active?: boolean;
    bookmark?: boolean;
    children?: Menu[];
}

@Injectable({
    providedIn: 'root'
})

export class NavService {

    public screenWidth: any
    public collapseSidebar: boolean = false
    public fullScreen = false;

    constructor() {
        this.onResize();
        if (this.screenWidth < 991) {
            this.collapseSidebar = true
        }
    }

    // Windows width
    @HostListener('window:resize', ['$event'])
    onResize(event?: any) {
        this.screenWidth = window.innerWidth;
    }

    MENUITEMS: Menu[] = navItems


    // Array
    items = new BehaviorSubject<Menu[]>(this.MENUITEMS);


}

import { CommonModule } from '@angular/common';
import {Component, computed, Input, signal, Signal, ViewEncapsulation} from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { NavService, Menu } from '../../services/nav.service';
import { FeatherIconsComponent } from '../feather-icons/feather-icons.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {Auth, User} from "@angular/fire/auth";
import {AuthService} from "../../services/auth.service";
import {async, Observable} from "rxjs";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule,RouterModule,FeatherIconsComponent,NgbModule ,TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  protected isLoggedIn : Signal<boolean> = signal(false)
  protected currentUser : Signal<User>
  public menuItems: Menu[] | any;
  public url: any;
  public fileurl: any;

  constructor(private auth : AuthService, private router: Router, public navServices: NavService) {


    console.log(this.currentUser)
    this.navServices.items.subscribe(menuItems => {
      this.menuItems = menuItems
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          menuItems.filter(items => {
            if (items.path === event.url)
              this.setNavActive(items)
            if (!items.children) return false
            items.children.filter(subItems => {
              if (subItems.path === event.url)
                this.setNavActive(subItems)
              if (!subItems.children) return false
              subItems.children.filter(subSubItems => {
                if (subSubItems.path === event.url)
                  this.setNavActive(subSubItems)
              })
              return
            })
            return
          }
          )
        }
      })
    })
  }

  // Active Nave state
  setNavActive(item:any) {
    this.menuItems.filter((menuItem:any) => {
      if (menuItem != item)
        menuItem.active = false
      if (menuItem.children && menuItem.children.includes(item))
        menuItem.active = true
      if (menuItem.children) {
        menuItem.children.filter((submenuItems:any) => {
          if (submenuItems.children && submenuItems.children.includes(item)) {
            menuItem.active = true
            submenuItems.active = true
          }
        })
      }
    })
  }

  // Click Toggle menu
  toggletNavActive(item:any) {
    if (!item.active) {
      this.menuItems.forEach((a:any) => {
        if (this.menuItems.includes(item))
          a.active = false
        if (!a.children) return false
        a.children.forEach((b:any) => {
          if (a.children.includes(item)) {
            b.active = false
          }
        })
        return true

      });
    }
    item.active = !item.active
  }

  //Fileupload
  readUrl(event: any) {
    if (event.target.files.length === 0)
      return;
    //Image upload validation
    var mimeType = event.target.files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }
    // Image upload
    var reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = (_event) => {
      this.url = reader.result;
    }
  }


  protected readonly async = async;
}

import { Component } from '@angular/core';

@Component({
    selector: 'app-sidenav',
    imports: [],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  isOpen = false;

  toggle() {
    this.isOpen = !this.isOpen;
  }
}

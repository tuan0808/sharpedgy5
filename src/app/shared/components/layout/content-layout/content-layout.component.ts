import { Component, OnInit, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, useAnimation } from '@angular/animations';
import { bounce, zoomOut, zoomIn, fadeIn, bounceIn } from 'ng-animate';
import { NavService } from '../../../services/nav.service';
import { CustomizerService } from '../../../services/customizer.service';
import * as feather from 'feather-icons';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { RightSidebarComponent } from '../../right-sidebar/right-sidebar.component';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../../footer/footer.component';
import { CustomizerComponent } from '../../customizer/customizer.component';

@Component({
    selector: 'app-content-layout',
    imports: [CommonModule, HeaderComponent, SidebarComponent,
        RightSidebarComponent, BreadcrumbComponent, RouterModule,
        FooterComponent, CustomizerComponent],
    templateUrl: './content-layout.component.html',
    styleUrls: ['./content-layout.component.scss'],
    animations: [
        trigger('animateRoute', [transition('* => *', useAnimation(fadeIn, {
            // Set the duration to 5seconds and delay to 2 seconds
            //params: { timing: 3}
            }))])
    ]
})
export class ContentLayoutComponent implements OnInit, AfterViewInit {


  public right_side_bar: boolean;

  constructor(public navServices: NavService,
    public customizer: CustomizerService, private cd: ChangeDetectorRef) { }


  ngAfterViewInit() {
    this.cd.detectChanges();
    setTimeout(() => {
      feather.replace();
    });
  }

  @HostListener('document:click', ['$event'])
  clickedOutside(event: any) {
    // click outside Area perform following action
    document.getElementById('outer-container')!.onclick = function (e) {
      e.stopPropagation()
      if (e.target != document.getElementById('search-outer')) {
        document.getElementsByTagName("body")[0].classList.remove("offcanvas");
      }
      if (e.target != document.getElementById('outer-container')) {
        document.getElementById("canvas-bookmark")!.classList.remove("offcanvas-bookmark");
      }
    }
  }

  public getRouterOutletState(outlet: any) {
    return outlet.isActivated ? outlet.activatedRoute : '';
  }

  public rightSidebar($event: any) {
    this.right_side_bar = $event
  }

  ngOnInit() { }

}

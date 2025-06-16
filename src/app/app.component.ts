import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterOutlet} from '@angular/router';
import {LoaderComponent} from "./shared/components/loader/loader.component";
import {AuthService} from "./shared/services/auth.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  constructor() {
    (window as any).global = window;
  }

  // async ngOnInit() {
  //   await this.authService.ensureAuthInitialized();
  //   const user = await this.authService.handleRedirectResult();
  //   if (user) {
  //     const redirectUrl = this.authService.getRedirectUrl() || '/';
  //     this.authService.clearRedirectUrl();
  //     await this.router.navigate([redirectUrl]);
  //   }
  // }
}

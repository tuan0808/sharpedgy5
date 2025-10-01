import {HostListener, inject, Injectable, signal} from '@angular/core';
import {ToastrService} from "ngx-toastr";

@Injectable()
export class ScrollService {
  private readonly toastr = inject(ToastrService);
  readonly isAtTop = signal<boolean>(true);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop || 0;

    const wasAtTop = this.isAtTop();
    const nowAtTop = scrollTop <= 10;

    this.isAtTop.set(nowAtTop);

    if (wasAtTop && !nowAtTop) {
      this.toastr.info('Scroll back to top to see all options', 'Scrolled Down');
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

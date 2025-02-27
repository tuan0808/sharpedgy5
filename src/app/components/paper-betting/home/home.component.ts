import {Component, computed, effect, HostListener, inject, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {MdbAccordionModule} from "mdb-angular-ui-kit/accordion";
import {GameCardComponent} from "./game-card/game-card.component";
import {SportType} from "../../../shared/model/SportType";
import {BetSettlementService} from "../../../shared/services/betSettlement.service";
import {Game} from "../../../shared/model/paper-betting/Game";
import {BehaviorSubject, firstValueFrom, Observable, of, retry, timeout} from "rxjs";
import {CurrencyPipe, DatePipe} from "@angular/common";
import {SportDetail} from "../../../shared/model/SportDetail";
import {PaginationComponent} from "../../../shared/components/pagination/pagination.component";

import {BetHistory} from "../../../shared/model/paper-betting/BetHistory";
import {HttpClient} from "@angular/common/http";
import {catchError, filter, tap} from "rxjs/operators";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [
    MdbAccordionModule,
    GameCardComponent,
    DatePipe,
    PaginationComponent,
    CurrencyPipe
  ],
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private readonly betSettlement = inject(BetSettlementService);
  private readonly toastr = inject(ToastrService);
  private readonly MAX_LOAD_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds
  private previousBalance: number | null = null;

  // Scroll tracking
  protected isAtTop = signal<boolean>(true);

  // Signals
  protected readonly account = this.betSettlement.account;
  protected readonly displayedGames = computed(() => {
    const allGames = this.betSettlement.allGames();
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = Math.min(startIndex + this.pageSize(), allGames.length);
    return allGames.slice(startIndex, endIndex);
  });

  protected readonly sports = signal<SportDetail[]>([
    new SportDetail("NFL", "🏈", SportType.NFL),
    new SportDetail("NHL", "🏒", SportType.NHL),
  ]);
  protected readonly selectedSport = signal<SportType>(SportType.NFL);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);
  protected readonly totalPages = computed(() => {
    const totalGames = this.betSettlement.allGames().length;
    return Math.ceil(totalGames / this.pageSize());
  });

  constructor() {
    // Setup effect to watch for account changes
    effect(() => {
      const account = this.account();
      if (account) {
        this.hasError.set(false);
        this.errorMessage.set('');

        this.toastr.info(account.balance.toFixed(), "Balance Change");
        // Check for balance changes and show notification
        if (this.previousBalance !== null && this.previousBalance !== account.balance) {
          const difference = account.balance - this.previousBalance;
          const message = difference > 0
              ? `Balance increased by ${difference.toFixed(2)}!`
              : `Balance decreased by ${Math.abs(difference).toFixed(2)}`;

          const toastrType = difference > 0 ? 'success' : 'info';
          this.toastr[toastrType](message, 'Balance Update');
        }
        this.previousBalance = account.balance;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.waitForUser();
    console.log('User ID ready:', this.betSettlement.currentUserId());
    await this.loadGames();
  }

  // Use Angular's HostListener for scroll events
  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const wasAtTop = this.isAtTop();
    this.isAtTop.set(scrollTop <= 10);

    // If user just scrolled away from the top, show notification
    if (wasAtTop && !this.isAtTop()) {
      this.toastr.info('Scroll back to top to see all options', 'Scrolled Down');
    }
  }

  private async waitForUser(retryCount = 0): Promise<void> {
    try {
      while (!this.betSettlement.currentUserId()) {
        if (retryCount >= this.MAX_LOAD_RETRIES) {
          throw new Error('Failed to load user after maximum retries');
        }
        console.log(`Waiting for user, attempt ${retryCount + 1}/${this.MAX_LOAD_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retryCount++;
      }
    } catch (error) {
      console.error('Error waiting for user:', error);
      this.handleError(error);
    }
  }

  private async loadGames(): Promise<void> {
    if (this.isLoading() || !this.betSettlement.currentUserId()) {
      console.log('Skipping loadGames: Loading in progress or no user ID');
      return;
    }

    try {
      this.isLoading.set(true);
      this.hasError.set(false);
      this.errorMessage.set('');

      const gamesObservable = this.betSettlement.getSportsByNFL(this.selectedSport()).pipe(
          timeout(10000),
          retry({
            count: 2,
            delay: (error, retryCount) => {
              console.log(`Retrying game load attempt ${retryCount}`, error);
              return new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
            },
          }),
          tap(games => console.log(`Retrieved ${games?.length} games`)),
          catchError(err => {
            console.error('Game fetch failed:', err);
            return of([]); // Return an empty array as a fallback
          })
      );

      await firstValueFrom(gamesObservable);
    } catch (error) {
      console.error('Failed to load games:', error);
      this.handleError(error);
      this.betSettlement.allGames.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleError(error: any) {
    this.hasError.set(true);
    if (error instanceof Error) {
      this.errorMessage.set(error.message);
      this.toastr.error(error.message, 'Error');
    } else {
      this.errorMessage.set('An unexpected error occurred');
      this.toastr.error('An unexpected error occurred', 'Error');
    }
  }

  // Event Handlers
  async onSportSelect(type: SportType): Promise<void> {
    if (this.selectedSport() === type && this.betSettlement.allGames().length > 0) {
      return;
    }

    this.selectedSport.set(type);
    this.currentPage.set(1);
    await this.loadGames();
  }

  async onPageChange(page: number): Promise<void> {
    this.currentPage.set(page);
  }

  async onPageSizeChange(size: number): Promise<void> {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  async onRetry(): Promise<void> {
    await this.loadGames();
  }

  // Scroll to top helper method
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

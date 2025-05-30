import { Component, computed, effect, HostListener, inject, OnInit, Signal, signal, ChangeDetectorRef } from '@angular/core';
import { MdbAccordionModule } from 'mdb-angular-ui-kit/accordion';
import { GameCardComponent } from './game-card/game-card.component';
import { SportType } from '../../../shared/model/SportType';
import { BetSettlementService } from '../../../shared/services/betSettlement.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { SportDetail } from '../../../shared/model/SportDetail';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastrService } from 'ngx-toastr';
import { Credit } from '../../../shared/model/paper-betting/Credit';
import { Game } from '../../../shared/model/paper-betting/Game';
import { firstValueFrom } from 'rxjs';
import { timeout, retry, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
  private readonly cdr = inject(ChangeDetectorRef); // For forcing change detection
  private readonly MAX_LOAD_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;
  private previousBalance: number | null = null;

  // Signals
  protected isAtTop = signal<boolean>(true);
  protected readonly account = this.betSettlement.account;
  protected readonly balance = this.betSettlement.credit;
  protected readonly displayedGames = computed(() => {
    const allGames = this.betSettlement.allGames();
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = Math.min(startIndex + this.pageSize(), allGames.length);
    console.log('Computing displayedGames:', {
      allGamesLength: allGames.length,
      currentPage: this.currentPage(),
      pageSize: this.pageSize(),
      startIndex,
      endIndex,
      games: allGames.slice(startIndex, endIndex)
    });
    return allGames.slice(startIndex, endIndex);
  });

  protected readonly sports = signal<SportDetail[]>([
    new SportDetail('NFL', '🏈', SportType.NFL),
    new SportDetail('NHL', '🏒', SportType.NHL),
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
    // Effect to monitor account, credit, and games
    effect(() => {
      const account = this.account();
      const credit = this.balance();
      const games = this.displayedGames();
      console.log('Effect triggered:', {
        account: account ? 'present' : 'null',
        credit: credit ? credit.balance : 'null',
        gamesLength: games.length
      });
      if (account && credit) {
        this.hasError.set(false);
        this.errorMessage.set('');
        if (this.previousBalance !== null && this.previousBalance !== credit.balance) {
          const difference = credit.balance - this.previousBalance;
          const message = difference > 0
              ? `Balance increased by ${difference.toFixed(2)}!`
              : `Balance decreased by ${Math.abs(difference).toFixed(2)}`;
          const toastrType = difference > 0 ? 'success' : 'info';
          this.toastr[toastrType](message, 'Balance Update');
        }
        this.previousBalance = credit.balance;
      }
      // Force change detection to ensure UI updates
      this.cdr.markForCheck();
    });
  }

  async ngOnInit(): Promise<void> {
    await this.waitForUser();
    console.log('User ID ready:', this.betSettlement.currentUserId());
    await this.loadGames();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const wasAtTop = this.isAtTop();
    this.isAtTop.set(scrollTop <= 10);
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
            this.errorMessage.set('Failed to load games');
            return of([]);
          })
      );

      await firstValueFrom(gamesObservable);
      // Force change detection after loading games
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Failed to load games:', error);
      this.handleError(error);
      this.betSettlement.allGames.set([]);
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck(); // Ensure UI updates
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
    this.cdr.markForCheck();
  }

  async onSportSelect(type: SportType): Promise<void> {
    if (this.selectedSport() === type && this.betSettlement.allGames().length > 0) {
      return;
    }
    this.selectedSport.set(type);
    this.currentPage.set(1);
    await this.loadGames();
  }

  async onPageChange(page: number): Promise<void> {
    const totalPages = this.totalPages();
    const validPage = Math.max(1, Math.min(page, totalPages));
    console.log('Page changed to:', validPage, 'Total pages:', totalPages);
    this.currentPage.set(validPage);
    this.cdr.markForCheck();
  }

  async onPageSizeChange(size: number): Promise<void> {
    console.log('Page size changed to:', size);
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.cdr.markForCheck();
  }

  async onRetry(): Promise<void> {
    await this.loadGames();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

import {ChangeDetectorRef, Component, computed, effect, HostListener, inject, OnInit, signal} from '@angular/core';
import {MdbAccordionModule} from 'mdb-angular-ui-kit/accordion';
import {GameCardComponent} from './game-card/game-card.component';
import {SportType} from '../../../shared/model/SportType';
import {BetSettlementService} from '../../../shared/services/betSettlement.service';
import {SportDetail} from '../../../shared/model/SportDetail';
import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {ToastrService} from 'ngx-toastr';
import {Game} from '../../../shared/model/paper-betting/Game';
import {firstValueFrom, of} from 'rxjs';
import {catchError, retry, tap, timeout} from 'rxjs/operators';

// Add interface for paginated response
interface PagedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: true,
    imports: [
        MdbAccordionModule,
        GameCardComponent,
        PaginationComponent
    ],
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    private readonly betSettlement = inject(BetSettlementService);
    private readonly toastr = inject(ToastrService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly MAX_LOAD_RETRIES = 3;
    private readonly RETRY_DELAY = 2000;
    private previousBalance: number | null = null;

    // Signals
    protected isAtTop = signal<boolean>(true);
    protected readonly account = this.betSettlement.account;
    protected readonly balance = this.betSettlement.credit;

    // Updated to work with server-side pagination
    protected readonly currentPageGames = signal<Game[]>([]);
    protected readonly displayedGames = computed(() => this.currentPageGames());

    protected readonly sports = signal<SportDetail[]>([
        new SportDetail('NFL', '🏈', SportType.NFL),
        new SportDetail('NHL', '🏒', SportType.NHL),
        new SportDetail('MLB', '', SportType.MLB),
        new SportDetail('NBA','', SportType.NBA )
    ]);
    protected readonly selectedSport = signal<SportType>(SportType.NFL);
    protected readonly isLoading = signal<boolean>(false);
    protected readonly hasError = signal<boolean>(false);
    protected readonly errorMessage = signal<string>('');
    protected readonly currentPage = signal<number>(1);
    protected readonly pageSize = signal<number>(10);

    // Updated pagination signals for server-side pagination
    protected readonly totalPages = signal<number>(0);
    protected readonly totalElements = signal<number>(0);

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

    // Updated loadGames method to use server-side pagination
    private async loadGames(): Promise<void> {
        const userId = this.betSettlement.currentUserId();

        if (this.isLoading() || !userId) {
            console.log('Skipping loadGames: Loading in progress or no user ID');
            return;
        }

        try {
            this.isLoading.set(true);
            this.hasError.set(false);
            this.errorMessage.set('');

            // Convert to 0-based page index for backend (Spring Data uses 0-based indexing)
            const pageIndex = this.currentPage() - 1;
            const selectedSport = this.selectedSport();

            console.log('Loading games with pagination:', {
                page: pageIndex,
                size: this.pageSize(),
                sport: SportType[selectedSport],
                userId: userId
            });

            // Updated method call to use pagination parameters
            const gamesObservable = this.betSettlement.getUpcomingGamesPaginated(
                userId,
                selectedSport,
                pageIndex,
                this.pageSize()
            ).pipe(
                timeout(10000),
                retry({
                    count: 2,
                    delay: (error, retryCount) => {
                        console.log(`Retrying game load for ${SportType[selectedSport]}, attempt ${retryCount}:`, error);
                        return new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                    },
                }),
                tap(pagedResponse => {
                    console.log(`Retrieved ${pagedResponse.content.length} ${SportType[selectedSport]} games:`, pagedResponse);
                }),
                catchError(err => {
                    console.error(`Paginated game fetch failed for ${SportType[selectedSport]}:`, err);
                    const errorMsg = `Failed to load ${SportType[selectedSport]} games`;
                    this.errorMessage.set(errorMsg);
                    // Return empty page structure
                    return of({
                        content: [],
                        totalPages: 0,
                        totalElements: 0,
                        size: this.pageSize(),
                        number: pageIndex,
                        numberOfElements: 0,
                        first: true,
                        last: true
                    } as PagedResponse<Game>);
                })
            );

            const pagedResponse = await firstValueFrom(gamesObservable);

            // Update signals with paginated data
            this.currentPageGames.set(pagedResponse.content);
            this.totalPages.set(pagedResponse.totalPages);
            this.totalElements.set(pagedResponse.totalElements);

            console.log(`Updated pagination state for ${SportType[selectedSport]}:`, {
                currentPage: this.currentPage(),
                totalPages: this.totalPages(),
                totalElements: this.totalElements(),
                gamesOnPage: pagedResponse.content.length
            });

            // Show message if no games found for this sport
            if (pagedResponse.totalElements === 0) {
                this.toastr.info(`No ${SportType[selectedSport]} games available at the moment`, 'No Games');
            }

            this.cdr.markForCheck();
        } catch (error) {
            console.error(`Failed to load ${SportType[this.selectedSport()]} games:`, error);
            this.handleError(error);
            this.currentPageGames.set([]);
        } finally {
            this.isLoading.set(false);
            this.cdr.markForCheck();
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
        // Don't reload if same sport is selected and we have games
        if (this.selectedSport() === type && this.currentPageGames().length > 0 && !this.hasError()) {
            console.log(`Sport ${SportType[type]} already selected with games loaded`);
            return;
        }

        try {
            console.log(`Switching to sport: ${SportType[type]}`);

            // Update the selected sport immediately
            this.selectedSport.set(type);

            // Reset pagination to first page when changing sports
            this.currentPage.set(1);

            // Clear current games to show loading state
            this.currentPageGames.set([]);

            // Reset error state
            this.hasError.set(false);
            this.errorMessage.set('');

            // Load games for the new sport
            await this.loadGames();

            // Show success message if games were loaded
            if (this.currentPageGames().length > 0) {
                this.toastr.info(`Loaded ${SportType[type]} games`, 'Sport Changed');
            }

        } catch (error) {
            console.error(`Failed to switch to sport ${SportType[type]}:`, error);
            this.handleError(error);
            // Optionally revert to previous sport selection on error
            // this.selectedSport.set(previousSport);
        }
    }


    // Updated page change handler to reload data from server
    async onPageChange(page: number): Promise<void> {
        const totalPages = this.totalPages();
        const validPage = Math.max(1, Math.min(page, totalPages));

        console.log('Page changed to:', validPage, 'Total pages:', totalPages);

        if (this.currentPage() !== validPage) {
            this.currentPage.set(validPage);
            await this.loadGames(); // Reload games for the new page
        }
    }

    // Updated page size change handler to reload data
    async onPageSizeChange(size: number): Promise<void> {
        console.log('Page size changed to:', size);
        this.pageSize.set(size);
        this.currentPage.set(1); // Reset to first page when changing page size
        await this.loadGames(); // Reload games with new page size
    }

    async onRetry(): Promise<void> {
        await this.loadGames();
    }

    scrollToTop(): void {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

    protected readonly Math = Math;
}

import {Component, computed, inject, Signal, signal} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {map} from "rxjs/operators";
import {BehaviorSubject, combineLatest} from "rxjs";
import {AsyncPipe, DatePipe} from "@angular/common";
import {AccountAccordionComponent} from "../account-accordion/account-accordion.component";
import {Account} from "../../../shared/model/paper-betting/Account";
import {PaginationComponent} from "../../../shared/components/pagination/pagination.component";
import {AccountService} from "../../../shared/services/account.service";

class BettingService {
}

@Component({
  selector: 'app-betting-history',
  standalone: true,
  imports: [
    FormsModule,
    AsyncPipe,
    AccountAccordionComponent,
    PaginationComponent,
    DatePipe
  ],
  templateUrl: './betting-history.component.html',
  styleUrl: './betting-history.component.scss'
})
export class BettingHistoryComponent {
  // Signals for reactive state management
  private accounts = signal<Account[]>([]);
  protected searchTerm = signal<string>('');
  protected filterStatus = signal<string>('all');
  protected sortOption = signal<string>('newest');
  protected pageSize = signal<number>(5);
  private currentPage = signal<number>(1);
  private expandedAccounts = signal<Set<string>>(new Set());

  private accountService: AccountService = inject(AccountService);

  // Computed signals for derived state
  protected filteredAccounts = computed(() => {
    let filtered = this.accounts();

    // Apply search filter
    if (this.searchTerm()) {
      const search = this.searchTerm().toLowerCase();
      filtered = filtered.filter(account =>
          account.id.toString().includes(search)
      );
    }

    // Apply status filter
    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter(account =>
          account.activeAccount === (this.filterStatus() === 'active')
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (this.sortOption()) {
        case 'newest':
          return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
        case 'oldest':
          return new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime();
        case 'highest-balance':
          return b.balance - a.balance;
        case 'lowest-balance':
          return a.balance - b.balance;
        default:
          return 0;
      }
    });

    return filtered;
  });

  protected paginatedAccounts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAccounts().slice(start, start + this.pageSize());
  });

  protected totalPages = computed(() =>
      Math.ceil(this.filteredAccounts().length / this.pageSize())
  );

  constructor() {
    // Subscribe to account updates
    this.accountService.accounts$.subscribe(accounts => {
      this.accounts.set(accounts);
    });
  }

  // Event handlers
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1); // Reset to first page when search changes
  }

  onFilterChange(status: string): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
  }

  onSortChange(option: string): void {
    this.sortOption.set(option);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  toggleAccount(accountId: string): void {
    const expanded = this.expandedAccounts();
    const newExpanded              = new Set(expanded);

    if (expanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }

    this.expandedAccounts.set(newExpanded);
  }

  // Helper method to check if an account is expanded
  isAccountExpanded(accountId: string): boolean {
    return this.expandedAccounts().has(accountId);
  }
}

import {Component, computed, inject, Signal, signal} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {Status} from "../../../shared/model/enums/Status"
import {Account} from "../../../shared/model/paper-betting/Account";
import {BetTypes} from "../../../shared/model/enums/BetTypes";
import {SportType} from "../../../shared/model/SportType";
import {CurrencyPipe, DatePipe, NgForOf, NgIf} from "@angular/common";
import {BetSettlementService} from "../../../shared/services/betSettlement.service";
import {toSignal} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-betting-history',
  standalone: true,
    imports: [
        FormsModule,
        DatePipe,
        CurrencyPipe,
    ],
  templateUrl: './betting-history.component.html',
  styleUrl: './betting-history.component.scss'
})
export class BettingHistoryComponent {
  private betHistoryService = inject(BetSettlementService);

  protected readonly accounts: Signal<Account[]>;
  protected expandedBetId = signal<string | null>(null);
  private selectedAccountIdSignal = signal<number | null>(null);

  constructor() {
    let data = this.betHistoryService.getAccounts();
    this.accounts = toSignal(
        data,
        { initialValue: [] }
    );

    // Set the initial selected account to the active one
    data.subscribe(accounts => {
      const activeAccount = accounts.find(acc => acc.activeAccount);
      if (activeAccount) {
        this.selectedAccountIdSignal.set(activeAccount.id);
      }
    });
  }

  protected readonly selectedAccount = computed(() =>
      this.accounts().find(acc => acc.id === this.selectedAccountIdSignal())
  );

  protected readonly Status = Status;
  protected readonly BetTypes = BetTypes;
  protected readonly SportType = SportType;

  selectAccount(accountId: number): void {
    this.selectedAccountIdSignal.set(accountId);
  }

  // Rest of the component methods remain the same
  toggleBetDetails(gameId: string): void {
    this.expandedBetId.set(
        this.expandedBetId() === gameId ? null : gameId
    );
  }

  isBetExpanded(gameId: string): boolean {
    return this.expandedBetId() === gameId;
  }

  scroll(direction: 'left' | 'right'): void {
    const container = document.querySelector('.carousel-items');
    const scrollAmount = 300;
    if (container) {
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  calculateWinRate(account: Account): string {
    const wins = account.betHistory.filter(bet => bet.status === Status.WIN).length;
    const total = account.betHistory.filter(bet => bet.status !== Status.PENDING).length;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
  }

  calculateAvgBet(account: Account): string {
    const total = account.betHistory.reduce((sum, bet) => sum + bet.amount, 0);
    return (total / account.betHistory.length || 0).toFixed(2);
  }

  getPendingBets(account: Account): number {
    return account.betHistory.filter(bet => bet.status === Status.PENDING).length;
  }

  getStatusClass(status: Status): string {
    switch(status) {
      case Status.WIN: return 'win';
      case Status.LOSS: return 'loss';
      case Status.PENDING: return 'pending';
      default: return '';
    }
  }
}

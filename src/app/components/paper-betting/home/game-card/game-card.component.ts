import { Component, inject, input, signal, computed } from '@angular/core';
import { Game } from "../../../../shared/model/paper-betting/Game";
import { DatePipe, NgClass } from "@angular/common";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { BetTypes } from "../../../../shared/model/enums/BetTypes";
import { SportType } from "../../../../shared/model/SportType";
import { BetSettlementService } from "../../../../shared/services/betSettlement.service";
import { BetFormComponent } from "../bet-form/bet-form.component";
import { PaperBetRecord } from "../../../../shared/model/paper-betting/PaperBetRecord";
import { EventStatus } from "../../../../shared/model/enums/EventStatus";
import { ToastrService } from 'ngx-toastr';
import { BetSettlement } from "../../../../shared/model/paper-betting/BetSettlement";
import { BetResponseState } from "../../../../shared/model/enums/BetResponseState";

@Component({
    selector: 'app-game-card',
    imports: [
        DatePipe,
        NgClass
    ],
    templateUrl: './game-card.component.html',
    styleUrl: './game-card.component.scss'
})
export class GameCardComponent {
  private modalService = inject(NgbModal);
  private betSettlementService = inject(BetSettlementService);
  private toastr = inject(ToastrService);

  // Inputs from parent
  gameData = input.required<Game>();
  sportType = input.required<SportType>();

  // Track if bet is currently being processed
  private processingBet = signal<boolean>(false);

  // Computed signal to check if this game has a bet settlement
  protected hasBetPlaced = computed(() => {
    const game = this.gameData();
    return !!game.betSettlement;
  });

  // Computed signal for bet status display
  protected betStatusClass = computed(() => {
    const settlement = this.gameData().betSettlement;
    if (!settlement) return '';

    switch (settlement.status) {
      case EventStatus.WIN:
        return 'text-success';
      case EventStatus.LOSS:
        return 'text-danger';
      case EventStatus.PENDING:
        return 'text-warning';
      case EventStatus.CANCELLED:
        return 'text-muted';
      case EventStatus.PUSH:
        return 'text-info';
      default:
        return '';
    }
  });

  // Computed signal for bet status icon
  protected betStatusIcon = computed(() => {
    const settlement = this.gameData().betSettlement;
    if (!settlement) return '';

    switch (settlement.status) {
      case EventStatus.WIN:
        return '✓';
      case EventStatus.LOSS:
        return '✗';
      case EventStatus.PENDING:
        return '⏱';
      case EventStatus.CANCELLED:
        return '⊘';
      case EventStatus.PUSH:
        return '↔';
      default:
        return '';
    }
  });

  isProcessingBet(): boolean {
    return this.processingBet();
  }

  placePaperBet() {
    // Don't allow placing bet if one already exists or is being processed
    if (this.hasBetPlaced() || this.processingBet()) {
      return;
    }

    const modalRef = this.modalService.open(BetFormComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.game = this.gameData();
    modalRef.componentInstance.sportType = this.sportType();
    modalRef.componentInstance.uid = this.betSettlementService.currentUserId() || '';

    modalRef.result.then((betData: BetSettlement) => {
      if (betData) {
        this.handleBetSubmission(betData);
      }
    }).catch((dismissReason) => {
      console.log('Bet form dismissed:', dismissReason);
    });
  }

  private async handleBetSubmission(betData: BetSettlement): Promise<void> {
    const userId = this.betSettlementService.currentUserId();
    if (!userId) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    this.processingBet.set(true);

    const paperBetRecord = new PaperBetRecord();
    paperBetRecord.gameId = this.gameData().id;
    paperBetRecord.userId = userId;
    paperBetRecord.sport = this.sportType();
    paperBetRecord.betType = betData.betType as unknown as BetTypes;
    paperBetRecord.wagerValue = betData.wagerValue;
    paperBetRecord.wagerAmount = betData.wagerAmount;
    paperBetRecord.status = EventStatus.PENDING;
    paperBetRecord.selectedTeam = betData.selectedTeam;
    paperBetRecord.potentialWinnings = this.calculatePotentialWinnings(betData.wagerAmount, betData.wagerValue);

    try {
      this.toastr.info(`Placing $${paperBetRecord.wagerAmount} bet...`, 'Processing');

      const result = await this.betSettlementService.addRecordOptimistic(
          paperBetRecord,
          userId,
          this.generateTempId()
      );

      console.log('BetResult from server:', result);

      // Handle the server's BetResult response
      this.handleBetResult(result, betData);

    } catch (error) {
      console.error('Bet failed:', error);
      this.toastr.error('Failed to place bet', 'Error');
    } finally {
      this.processingBet.set(false);
    }
  }

  private handleBetResult(result: any, originalBetData: BetSettlement): void {
    switch (result.status) {
      case BetResponseState.SUCCESS:
        this.handleSuccessfulBet(result, originalBetData);
        break;

      case BetResponseState.CREDIT_LIMIT_EXCEEDED:
        this.toastr.error(
            result.message || 'Credit limit exceeded. Please check your available credit.',
            'Credit Limit Exceeded'
        );
        break;

      case BetResponseState.USER_NOT_FOUND:
      case BetResponseState.ACCOUNT_NOT_FOUND:
        this.toastr.error(
            'Apologies, an error has occurred. Please contact an administrator for help.',
            'Account Error'
        );
        break;

      case BetResponseState.ERROR:
      default:
        this.toastr.error(
            result.message || 'An error has occurred, please try again later.',
            'Error'
        );
        break;
    }
  }

  private handleSuccessfulBet(result: any, originalBetData: BetSettlement): void {
    // Update balance and credit from the server's response
    if (result.balance !== undefined) {
      this.betSettlementService.updateBalance(result.balance);
      console.log(`Balance updated to: ${result.balance}`);
    }

    if (result.remainingCredit !== undefined && result.totalCredit !== undefined) {
      this.betSettlementService.updateCredit({
        remainingCredit: result.remainingCredit,
        totalCredit: result.totalCredit,
        balance: result.balance || 0
      });
      console.log(`Credit updated - Remaining: ${result.remainingCredit}, Total: ${result.totalCredit}`);
    }

    // Note: Don't manually update the game here - the service will handle it
    // The gameUpdate$ observable will trigger UI updates automatically

    this.toastr.success(
        `Bet placed successfully! $${originalBetData.wagerAmount} wagered on ${originalBetData.selectedTeam}.`,
        'Success',
        {
          timeOut: 5000,
          progressBar: true
        }
    );
  }

  private calculatePotentialWinnings(wagerAmount: number, wagerValue: number): number {
    // American odds calculation
    if (wagerValue > 0) {
      // Positive odds: (wagerAmount * (wagerValue / 100))
      return wagerAmount * (wagerValue / 100);
    } else {
      // Negative odds: (wagerAmount / (Math.abs(wagerValue) / 100))
      return wagerAmount / (Math.abs(wagerValue) / 100);
    }
  }

  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  viewMatchupDetails() {
    console.log('Viewing Matchup Details', this.gameData());
    this.toastr.info('Matchup details feature coming soon!', 'Info');
  }

  protected readonly BetTypes = BetTypes;
  protected readonly EventStatus = EventStatus;
}

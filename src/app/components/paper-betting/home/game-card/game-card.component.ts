import {Component, inject, input, signal} from '@angular/core';
import {Game} from "../../../../shared/model/paper-betting/Game";
import {DatePipe, NgClass} from "@angular/common";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BetTypes} from "../../../../shared/model/enums/BetTypes";
import {SportType} from "../../../../shared/model/SportType";
import {BetSettlementService} from "../../../../shared/services/betSettlement.service";
import {BetFormComponent} from "../bet-form/bet-form.component";
import {PaperBetRecord} from "../../../../shared/model/paper-betting/PaperBetRecord";
import {EventStatus} from "../../../../shared/model/enums/EventStatus";
import {ToastrService} from 'ngx-toastr';
import {BetSettlement} from "../../../../shared/model/paper-betting/BetSettlement";
import {BetResponseState} from "../../../../shared/model/enums/BetResponseState";

// Import BetResult from the service or create a proper shared interface
// DO NOT define BetResult locally - it should come from your API types

@Component({
  selector: 'app-game-card',
  standalone: true,
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

  // Inputs from parent - DISPLAY ONLY
  gameData = input.required<Game>();
  sportType = input.required<SportType>();

  // Track if bet is currently being processed
  private processingBet = signal<boolean>(false);

  isProcessingBet(): boolean {
    return this.processingBet();
  }

  placePaperBet() {
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
    paperBetRecord.betStatus = EventStatus.PENDING;
    paperBetRecord.selectedTeam = betData.selectedTeam;
    paperBetRecord.potentialWinnings = this.calculatePotentialWinnings(betData.wagerAmount, betData.wagerValue);

    try {
      this.toastr.info(`Placing $${paperBetRecord.wagerAmount} bet...`, 'Processing');

      // The service method returns the actual BetResult from your Kotlin API
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

  // Use the actual BetResult type from your service/API types, not a local interface
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

    // Create optimistic bet settlement for immediate UI update
    const betSettlement: BetSettlement = {
      betType: originalBetData.betType,
      selectedTeam: originalBetData.selectedTeam,
      status: EventStatus.PENDING,
      wagerValue: originalBetData.wagerValue,
      wagerAmount: originalBetData.wagerAmount
    };

    // Update the game with bet settlement optimistically
    this.updateGameWithBetSettlement(betSettlement);

    this.toastr.success(
        `Bet placed successfully! $${originalBetData.wagerAmount} wagered.`,
        'Success'
    );
  }

  private updateGameWithBetSettlement(betSettlement: BetSettlement): void {
    // Update the current game data with the bet settlement
    const currentGame = this.gameData();
    if (currentGame) {
      // This will trigger the UI to show the bet as placed
      // Note: This is optimistic - the actual update will come via WebSocket
      const updatedGame = {
        ...currentGame,
        betSettlement: betSettlement
      };

      // If you have a way to update the parent component's game data, do it here
      // Otherwise, this optimistic update will be replaced by the WebSocket update
      console.log('Game optimistically updated with bet settlement:', betSettlement);
    }
  }

  private calculatePotentialWinnings(wagerAmount: number, wagerValue: number): number {
    // Simplified calculation: adjust based on your actual logic for potential winnings
    return wagerAmount * (wagerValue > 0 ? wagerValue / 100 : Math.abs(100 / wagerValue));
  }

  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  viewMatchupDetails() {
    console.log('Viewing Matchup Details', this.gameData());
  }

  protected readonly BetTypes = BetTypes;
}

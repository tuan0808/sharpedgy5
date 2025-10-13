import { Component, inject, input, signal, computed } from '@angular/core';
import { Game } from "../../../../shared/model/paper-betting/Game";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { BetTypes } from "../../../../shared/model/enums/BetTypes";
import { SportType } from "../../../../shared/model/SportType";
import { EventStatus } from "../../../../shared/model/enums/EventStatus";
import { ToastrService } from 'ngx-toastr';
import { BetSettlement } from "../../../../shared/model/paper-betting/BetSettlement";
import { BetResponseState } from "../../../../shared/model/enums/BetResponseState";
import {PredictionFormComponent} from "../prediction-form/prediction-form.component";
import {PredictionsService} from "../../../../shared/services/predictions.service";
import {Prediction} from "../../../../shared/model/Prediction";

@Component({
  selector: 'app-prediction-card',
  imports: [ ],
  templateUrl: './prediction-card.component.html',
  styleUrl: './prediction-card.component.scss'
})
export class PredictionCardComponent {
  private modalService = inject(NgbModal);
 // private betSettlementService = inject(BetSettlementService);
  private predictionService = inject(PredictionsService);
  private toastr = inject(ToastrService);

  // Inputs from parent
  game = input.required<Game>();
  league = input.required<SportType>();

  // Track if bet is currently being processed
  private processingBet = signal<boolean>(false);

  expandedGame: number | null = null;

  // Computed signal to check if this game has a bet settlement
  protected hasBetPlaced = computed(() => {
    const game = this.game();
    return !!game.betSettlement;
  });

  // Computed signal for bet status display
  protected betStatusClass = computed(() => {
    const settlement = this.game().betSettlement;
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
    const settlement = this.game().betSettlement;
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
        return '↕';
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

    const modalRef = this.modalService.open(PredictionFormComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.game = this.game();
    modalRef.componentInstance.sportType = this.league();
    modalRef.componentInstance.uid = this.predictionService.currentUserId() || '';

    modalRef.result.then((betData: BetSettlement) => {
      if (betData) {
        this.handleBetSubmission(betData);
      }
    }).catch((dismissReason) => {
      console.log('Bet form dismissed:', dismissReason);
    });
  }


  private async handleBetSubmission(betData: BetSettlement): Promise<void> {
    const userId = this.predictionService.currentUserId();

    console.log(userId);
    if (!userId) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    this.processingBet.set(true);

    const prediction = new Prediction();
    prediction.gameId = this.game().id;
    prediction.userId = userId;
    prediction.sport = this.league();
    prediction.betType = betData.betType as unknown as BetTypes;
    prediction.wagerValue = betData.wagerValue;
    prediction.betStatus = EventStatus.PENDING;
    prediction.selectedTeam = betData.selectedTeam;
    prediction.message = betData.message;

    console.log(JSON.stringify(prediction));

    try {
      const result = await this.predictionService.addRecordOptimistic(
          prediction,
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

  viewMatchupDetails(gameId: number, event: Event) {
    event.stopPropagation();
    console.log('Viewing Matchup Details', this.game());
    this.toastr.info('Matchup details feature coming soon!', 'Info');
  }

  toggleAccordion(gameId: number): void {
    if (this.expandedGame === gameId) {
      this.expandedGame = null;
    } else {
      this.expandedGame = gameId;
    }
  }

  onSubmit() {
    this.placePaperBet();
  }

  get isGameBetPlaceable(): boolean {
    return this.game().status === 'Scheduled' || this.game().status === 'Delayed';
  }

  editGame(gameId: number, event: Event): void {
    event.stopPropagation();
    console.log(`Edit game ${gameId}`);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected readonly BetTypes = BetTypes;
  protected readonly EventStatus = EventStatus;

  isOverUnderBet() {
    return false;
  }
}

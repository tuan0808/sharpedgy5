import {Component, computed, input, signal} from '@angular/core';
import {Game} from "../../../../shared/model/paper-betting/Game";
import {SportType} from "../../../../shared/model/SportType";
import {BetFormComponent} from "../../../paper-betting/home/bet-form/bet-form.component";
import {BetSettlement} from "../../../../shared/model/paper-betting/BetSettlement";

@Component({
    selector: 'app-prediction-card',
    imports: [],
    templateUrl: './prediction-card.component.html',
    styleUrl: './prediction-card.component.scss'
})
export class PredictionCardComponent {
  game = input.required<Game>();
  league = input.required<SportType>();
  expandedGame: number | null = null;
  private processingBet = signal<boolean>(false);



  toggleAccordion(gameId: number): void {
    if (this.expandedGame === gameId) {
      this.expandedGame = null;
    } else {
      this.expandedGame = gameId;
    }
  }

  viewMatchup(gameId : number, event: Event): void {
    event.stopPropagation();
    console.log(`Matchup for game ${gameId}`);
  }

  onSubmit() {
    // Don't allow placing bet if one already exists or is being processed
    if (this.hasBetPlaced() || this.processingBet()) {
      return;
    }
  }

  // placePaperBet() {
  //   // Don't allow placing bet if one already exists or is being processed
  //   if (this.hasBetPlaced() || this.processingBet()) {
  //     return;
  //   }
  //
  //   const modalRef = this.modalService.open(BetFormComponent, {
  //     size: 'lg',
  //     backdrop: 'static'
  //   });
  //
  //   modalRef.componentInstance.game = this.gameData();
  //   modalRef.componentInstance.sportType = this.sportType();
  //   modalRef.componentInstance.uid = this.betSettlementService.currentUserId() || '';
  //
  //   modalRef.result.then((betData: BetSettlement) => {
  //     if (betData) {
  //       this.handleBetSubmission(betData);
  //     }
  //   }).catch((dismissReason) => {
  //     console.log('Bet form dismissed:', dismissReason);
  //   });
  // }

  protected hasBetPlaced = computed(() => {
    const game = this.game();
    return !!game.betSettlement;
  });

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
}

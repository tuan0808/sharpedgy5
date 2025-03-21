import {Component} from '@angular/core';
import {DatePipe} from "@angular/common";
import {BetFormComponent} from "../../../paper-betting/bet-form/bet-form.component";
import {FormBuilder, Validators} from "@angular/forms";
import {BetHistory} from "../../../../shared/model/paper-betting/BetHistory";
import {Status} from "../../../../shared/model/enums/Status";

@Component({
  selector: 'app-prediction-form',
  standalone: true,
    imports: [
        DatePipe
    ],
  templateUrl: './prediction-form.component.html',
  styleUrl: './prediction-form.component.scss'
})
export class PredictionFormComponent extends BetFormComponent {
  constructor() {
    super();
    // Extend the form with controlNote
    this.bettingForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0), Validators.max(5000)]],
      controlNote: ['', Validators.required]
    });
  }

  // Override onSubmit to include controlNote
  override async onSubmit() {
    if (this.isFormValid()) {
      const userId = this.uid || (await this.authService.getUID());
      if (!userId) {
        console.error('No user ID available');
        return;
      }

      const betHistory: BetHistory = {
        gameId: this.game.id,
        userId,
        homeTeam: this.game.homeTeam.name,
        awayTeam: this.game.awayTeam.name,
        gameStart: new Date(this.game.scheduled),
        sport: this.sportType,
        betType: this.selectedBetType,
        wagerValue: parseFloat(this.selectedTeam.odds),
        wagerAmount: this.bettingForm.value.amount,
        amount: this.bettingForm.value.amount,
        status: Status.PENDING,
        selectedTeam: this.selectedTeam.name,
        potentialWinnings: this.potentialWinnings,
        controlNote: this.bettingForm.value.controlNote // Added
      };

      const updatedGame = { ...this.game, betSettlement: betHistory };

      this.betSettlementService.addHistory(betHistory).subscribe({
        next: (newBalance) => {
          console.log('Bet placed, new balance:', newBalance);
          this.betPlaced.emit({ game: updatedGame, balance: newBalance });
          this.activeModal.close();
        },
        error: (err) => console.error('Bet placement failed:', err)
      });
    }
  }
}

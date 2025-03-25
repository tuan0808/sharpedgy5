import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DatePipe, NgClass, NgIf} from "@angular/common";
import {BetFormComponent} from "../../../paper-betting/home/bet-form/bet-form.component";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {BetHistory} from "../../../../shared/model/paper-betting/BetHistory";
import {Status} from "../../../../shared/model/enums/Status";
import {MdbRangeModule} from "mdb-angular-ui-kit/range";
import {Team} from "../../../../shared/model/paper-betting/Team";
import {AmericanOddsPipe} from "../../../../shared/pipes/american-odds.pipe";
import {BaseBetFormComponent} from "../../../base-bet-form-component/base-bet-form-component.component";

@Component({
  selector: 'app-prediction-form',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    NgClass,
    MdbRangeModule,
    NgIf,
    AmericanOddsPipe
  ],
  templateUrl: './prediction-form.component.html',
  styleUrls: ['./prediction-form.component.scss']
})
export class PredictionFormComponent extends BaseBetFormComponent {
  showConfirmation = false;
  submittedBetData: any = null;

  constructor() {
    super();
    this.bettingForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0), Validators.max(5000)]],
      confidence: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      notes: [''],
      controlNote: ['', Validators.required]
    });
  }

  override updatePotentialWinnings(): void {
    if (this.selectedTeam && this.selectedTeam.odds !== undefined) {
      const odds = this.selectedTeam.odds;
      const amount = this.bettingForm.value.amount || 0;
      let potentialWinnings = 0;

      if (odds > 0) {
        potentialWinnings = (amount * (odds / 100)) + amount;
      } else {
        potentialWinnings = (amount * (100 / Math.abs(odds))) + amount;
      }

      this.potentialWinnings = potentialWinnings;
    } else {
      this.potentialWinnings = 0;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.isFormValid()) {
      const betHistory = new BetHistory();
      const extraData = {
        confidence: this.bettingForm.value.confidence,
        notes: this.bettingForm.value.notes
      };
      betHistory.comment = JSON.stringify(extraData);
      betHistory.controlNote = this.bettingForm.value.controlNote;

      this.submittedBetData = {
        betHistory,
        game: { ...this.game, betSettlement: betHistory }
      };
      this.showConfirmation = true;
    }
  }

  confirmBet(): void {
    if (this.submittedBetData) {
      const { betHistory } = this.submittedBetData;
      this.submitBet(betHistory);
    }
  }

  editBet(): void {
    this.showConfirmation = false;
    this.submittedBetData = null;
  }

  formatConfidence(value: number): string {
    return `${value}%`;
  }

  protected readonly JSON = JSON;
}

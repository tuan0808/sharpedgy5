import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {DatePipe, NgClass, NgIf} from "@angular/common";
import {BetFormComponent} from "../../../paper-betting/home/bet-form/bet-form.component";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {BetHistory} from "../../../../shared/model/paper-betting/BetHistory";
import {Status} from "../../../../shared/model/enums/Status";
import {MdbRangeModule} from "mdb-angular-ui-kit/range";
import {Team} from "../../../../shared/model/paper-betting/Team";
import {AmericanOddsPipe} from "../../../../shared/pipes/american-odds.pipe";
import {BaseBetFormComponent} from "../../../base-bet-form-component/base-bet-form-component.component";
import {Prediction} from "../../../../shared/model/Prediction";
import {PredictionsService} from "../../../../shared/services/predictions.service";

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
  predictionService = inject(PredictionsService)
  showConfirmation = false;
  submittedBetData: any = null;

  constructor() {
    super();
    this.bettingForm = this.fb.group({
      amount: ['100', [Validators.required, Validators.min(0), Validators.max(5000)]],
      confidence: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      notes: [''],
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
      const prediction = new Prediction()
      prediction.selectTeam = ''
      prediction.confidenceLevel = this.bettingForm.value.confidence
      prediction.gameId = this.game.id
      prediction.note = this.bettingForm.value.notes
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

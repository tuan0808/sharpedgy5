import { Component, EventEmitter, inject, Output } from '@angular/core';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MdbRangeModule } from 'mdb-angular-ui-kit/range';
import { AmericanOddsPipe } from '../../../../shared/pipes/american-odds.pipe';
import { BaseBetFormComponent } from '../../../base-bet-form-component/base-bet-form-component.component';
import { Prediction } from '../../../../shared/model/Prediction';
import { PredictionsService } from '../../../../shared/services/predictions.service';
import { BetTypes } from '../../../../shared/model/enums/BetTypes';
import { SportType } from '../../../../shared/model/SportType';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {Status} from "../../../../shared/model/enums/Status";

interface SubmittedBetData {
  prediction: Prediction;
  gameDetails: {
    homeTeam: string;
    awayTeam: string;
    betType: string;
    selectedTeam: string;
    wagerValue: number;
    amount: number;
    potentialWinnings: number;
    comment: string;
    controlNote: string;
  };
}

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
  predictionService = inject(PredictionsService);
  activeModal = inject(NgbActiveModal);
  showConfirmation = false;
  submittedBetData: SubmittedBetData | null = null;
  @Output() predictionSubmitted = new EventEmitter<Prediction>();

  constructor() {
    super();
    this.bettingForm.addControl('confidence', this.fb.control(50, [Validators.required, Validators.min(0), Validators.max(100)]));
    this.bettingForm.addControl('notes', this.fb.control(''));
    this.bettingForm.patchValue({ amount: '100' });
  }

  override updatePotentialWinnings(): void {
    if (this.selectedTeam && this.selectedTeam.odds !== undefined) {
      const odds = this.selectedTeam.odds;
      const amount = parseFloat(this.bettingForm.value.amount) || 0;
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
      const prediction = new Prediction();
      prediction.gameId = this.game.id;
      prediction.betType = this.betTypes.find(bet => bet.id === this.selectedBetType)?.id as BetTypes || BetTypes.MONEYLINE;
      prediction.selectedTeam = this.selectedTeam?.name || '';
      prediction.confidence = this.bettingForm.value.confidence || 50;
      prediction.note = this.bettingForm.value.notes || '';
      prediction.sport = SportType.NFL; // TODO: Fix and implement fully
      prediction.gameStart = new Date(this.game.scheduled);
      prediction.status = Status.PENDING; // Assuming 0 is PENDING; adjust based on your enum
      prediction.wagerValue = parseFloat(this.bettingForm.value.amount) || 100;
     // prediction.userId = this.uid || '';
      prediction.creationDate = new Date();

      this.submittedBetData = {
        prediction,
        gameDetails: {
          homeTeam: this.game.homeTeam.name,
          awayTeam: this.game.awayTeam.name,
          betType: this.betTypes.find(bet => bet.id === this.selectedBetType)?.label || 'Moneyline',
          selectedTeam: this.selectedTeam?.name || '',
          wagerValue: this.selectedTeam?.odds || 0,
          amount: parseFloat(this.bettingForm.value.amount) || 100,
          potentialWinnings: this.potentialWinnings,
          comment: JSON.stringify({
            confidence: this.bettingForm.value.confidence || 50,
            notes: this.bettingForm.value.notes || ''
          }),
          controlNote: 'Pending confirmation'
        }
      };
      this.showConfirmation = true;
    }
  }

  confirmBet(): void {
    if (this.submittedBetData?.prediction) {
      this.submitPrediction(this.submittedBetData.prediction);
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

  private submitPrediction(prediction: Prediction): void {
    this.predictionService.submitPrediction(prediction).subscribe({
      next: (result) => {
        console.log('Prediction submitted:', result);
        this.showConfirmation = false;
        this.submittedBetData = null;
        this.bettingForm.reset({ amount: '100', confidence: 50, notes: '' });
        this.predictionSubmitted.emit(prediction);
        this.activeModal.close(result);
      },
      error: (err) => {
        console.error('Error submitting prediction:', err);
        alert('Failed to submit prediction. Please try again later.');
      }
    });
  }
}

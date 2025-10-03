import {Component, computed, EventEmitter, inject, Input, input, output, Output, signal} from '@angular/core';
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
import { EventStatus } from "../../../../shared/model/enums/EventStatus";
import {BetSettlement} from "../../../../shared/model/paper-betting/BetSettlement";
import {Game} from "../../../../shared/model/paper-betting/Game";

interface SubmittedPredictionData {
  prediction: Prediction;
  gameDetails: {
    homeTeam: string;
    awayTeam: string;
    betType: string;
    selectedTeam: string;
    wagerValue: number;
    confidence: number;
    notes: string;
    controlNote: string;
  };
}

@Component({
  selector: 'app-prediction-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    MdbRangeModule
  ],
  templateUrl: './prediction-form.component.html',
  styleUrls: ['./prediction-form.component.scss']
})
export class PredictionFormComponent extends BaseBetFormComponent {
  public activeModal = inject(NgbActiveModal);

  @Input() uid: string = '';
  @Input() sportType!: SportType;

  // Emit BetSettlement instead of BetSubmissionData
  @Output() betDataSubmitted = new EventEmitter<BetSettlement>();
  protected readonly displayedGames = computed(() => this.currentPageGames());
  protected readonly currentPageGames = signal<Game[]>([]);
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);
  protected readonly totalPages = signal<number>(0);
  protected readonly totalElements = signal<number>(0);
  constructor() {
    super();
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const betData = new BetSettlement();
      betData.betType = this.selectedBetType;
      betData.selectedTeam =  this.selectedTeam.abbreviation; // Convert team name/id to number
      betData.wagerValue = parseFloat(this.selectedTeam.odds);
      betData.status = EventStatus.PENDING;


      // Emit BetSettlement and close modal
      this.betDataSubmitted.emit(betData);
      this.activeModal.close(betData);
    }
  }
}

import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {Status} from "../../shared/model/enums/Status";
import {BetHistory} from "../../shared/model/paper-betting/BetHistory";
import {BetTypes} from "../../shared/model/enums/BetTypes";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Game} from "../../shared/model/paper-betting/Game";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {AuthService} from "../../shared/services/auth.service";
import {BetSettlementService} from "../../shared/services/betSettlement.service";
import {SportType} from "../../shared/model/SportType";
import {DatePipe, NgClass, NgIf} from "@angular/common";
import {MdbRangeModule} from "mdb-angular-ui-kit/range";
import {AmericanOddsPipe} from "../../shared/pipes/american-odds.pipe";

interface BetTypeOption {
  id: BetTypes;
  label: string;
  icon: string;
  isEnabled: boolean;
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
  template: ''
})
export abstract class BaseBetFormComponent {
  protected betSettlementService = inject(BetSettlementService);
  protected authService = inject(AuthService);
  protected fb = inject(FormBuilder);
  public activeModal = inject(NgbActiveModal);

  @Input() game!: Game;
  @Input() uid: string = '';
  @Input() sportType!: SportType;
  @Output() betPlaced = new EventEmitter<{ game: Game, balance: number }>();

  bettingForm: FormGroup;
  selectedBetType = BetTypes.MONEYLINE;
  selectedTeam: any = null;
  potentialWinnings: number = 0;
  homeTeamWinProbability = 0;
  awayTeamWinProbability = 0;

  betTypes: BetTypeOption[] = [
    { id: BetTypes.MONEYLINE, label: 'Money Line', icon: '💰', isEnabled: true },
    { id: BetTypes.POINT_SPREAD, label: 'Point Spread', icon: '📊', isEnabled: true },
    { id: BetTypes.OVER_UNDER, label: 'Over/Under', icon: '⚖️', isEnabled: true },
    { id: BetTypes.PARLAY, label: 'Parlay', icon: '🎲', isEnabled: false },
    { id: BetTypes.TEASER, label: 'Teaser', icon: '🎯', isEnabled: false },
    { id: BetTypes.ROUND_ROBIN, label: 'Round Robin', icon: '🔄', isEnabled: false },
    { id: BetTypes.PLEASER, label: 'Pleaser', icon: '🎪', isEnabled: false }
  ];

  protected constructor() {
    this.bettingForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0), Validators.max(5000)]]
    });
    this.calculateWinProbabilities();
  }

  calculateWinProbabilities(): void {
    if (this.game && this.game.moneylineHome !== undefined && this.game.moneylineAway !== undefined) {
      const homeOdds = this.game.moneylineHome;
      const awayOdds = this.game.moneylineAway;

      let homeImpliedProb: number;
      let awayImpliedProb: number;

      if (homeOdds > 0) {
        homeImpliedProb = 100 / (homeOdds + 100);
      } else {
        homeImpliedProb = Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
      }

      if (awayOdds > 0) {
        awayImpliedProb = 100 / (awayOdds + 100);
      } else {
        awayImpliedProb = Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);
      }

      const overround = homeImpliedProb + awayImpliedProb;
      this.homeTeamWinProbability = (homeImpliedProb / overround) * 100;
      this.awayTeamWinProbability = (awayImpliedProb / overround) * 100;
    } else {
      this.homeTeamWinProbability = 0;
      this.awayTeamWinProbability = 0;
    }
  }

  setSelectedBetType(betType: BetTypes): void {
    this.selectedBetType = betType;
    this.updatePotentialWinnings();
  }

  setSelectedTeam(team: any): void {
    this.selectedTeam = team;
    this.calculateWinProbabilities();
    this.updatePotentialWinnings();
  }

  updatePotentialWinnings(): void {
    const amount = this.bettingForm.get('amount')?.value;
    if (!amount || !this.selectedTeam || isNaN(amount)) {
      this.potentialWinnings = 0;
      return;
    }

    const odds = parseInt(this.selectedTeam.odds, 10);
    if (isNaN(odds)) {
      this.potentialWinnings = 0;
      return;
    }

    let profit: number;
    if (odds > 0) {
      profit = (amount * odds) / 100;
    } else if (odds < 0) {
      profit = amount * (100 / Math.abs(odds));
    } else {
      profit = amount;
    }

    this.potentialWinnings = Math.round(profit * 100) / 100;
  }

  isFormValid(): boolean {
    return this.bettingForm.valid &&
        this.selectedTeam !== null &&
        this.bettingForm.get('amount')?.value > 0;
  }

  async submitBet(betHistory: BetHistory): Promise<void> {
    const userId = this.uid || (await this.authService.getUID());
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    betHistory.gameId = this.game.id;
    betHistory.userId = userId;
    betHistory.homeTeam = this.game.homeTeam.name;
    betHistory.awayTeam = this.game.awayTeam.name;
    betHistory.gameStart = new Date(this.game.scheduled);
    betHistory.sport = this.sportType;
    betHistory.betType = this.selectedBetType;
    betHistory.wagerValue = parseFloat(this.selectedTeam.odds);
    betHistory.wagerAmount = this.bettingForm.value.amount;
    betHistory.amount = this.bettingForm.value.amount;
    betHistory.status = Status.PENDING;
    betHistory.selectedTeam = this.selectedTeam.name;
    betHistory.potentialWinnings = this.potentialWinnings;

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

// bet-form.component.ts
import {Component, computed, EventEmitter, inject, input, Input, output, Output, signal, Signal} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Game } from "../../../shared/model/paper-betting/Game";
import { BetTypes } from "../../../shared/model/enums/BetTypes";
import { SportType } from "../../../shared/model/SportType";
import {BetHistory} from "../../../shared/model/paper-betting/BetHistory";
import {BetSettlementService} from "../../../shared/services/betSettlement.service";
import {AuthService} from "../../../shared/services/auth.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {BetSettlement} from "../../../shared/model/paper-betting/BetSettlement";
import {CurrencyPipe, DatePipe, DecimalPipe} from "@angular/common";
import {Bet} from "../../../shared/model/paper-betting/Bet";
import {toSignal} from "@angular/core/rxjs-interop";
import {Status} from "../../../shared/model/enums/Status";
import {BettingHistoryComponent} from "../betting-history/betting-history.component";


interface BetTypeOption {
  id: BetTypes,
  label : string,
  icon : string
}
export interface BetFormErrors {
  amount: string;
  team: string;
  general: string;
}

export interface PotentialWinnings {
  winnings: string;
  totalReturn: string;
}


@Component({
  selector: 'app-bet-form',
  templateUrl: './bet-form.component.html',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe
  ],
  styleUrls: ['./bet-form.component.scss']
})
export class BetFormComponent {
  @Input() game!: Game;
  @Input() sportType!: SportType;
  @Output() betPlaced = new EventEmitter<{game: Game, balance: number}>();

  currentBalance: number = 0;
  potentialWinnings: number = 0;
  selectedTeamMoneyline: number = 0;

  readonly BetTypes = BetTypes;

  betTypeLabels = {
    [BetTypes.MONEYLINE]: 'Money Line',
    [BetTypes.POINT_SPREAD]: 'Point Spread',
    [BetTypes.OVER_UNDER]: 'Over/Under'
  };

  betForm!: FormGroup;

  constructor(
      private fb: FormBuilder,
      private gameService: BetSettlementService,
      private auth: AuthService,
      public activeModal: NgbActiveModal
  ) {
    this.balance = signal(this.gameService.account().balance);
    this.betForm = this.fb.group({
      betType: [null as BetTypes | null, Validators.required],
      selectedTeam: [null as string | null, Validators.required],
      wagerValue: [null as number | null, Validators.required],
      wagerAmount: [null as number | null, [
        Validators.required,
        Validators.min(0),
        Validators.max(5000),
        this.balanceValidator()
      ]]
    });

    // Subscribe to form changes to update calculations
    this.betForm.valueChanges.subscribe(() => {
      this.calculatePotentialWinnings();
    });

    // When bet type changes, reset team selection and wager value
    this.betForm.get('betType')?.valueChanges.subscribe(() => {
      this.betForm.patchValue({
        selectedTeam: null,
        wagerValue: null
      });
    });

    // When team selection changes, update the moneyline
    this.betForm.get('selectedTeam')?.valueChanges.subscribe((team) => {
      if (team === this.game.homeTeam.name) {
        this.selectedTeamMoneyline = this.game.moneylineHome;
      } else if (team === this.game.awayTeam.name) {
        this.selectedTeamMoneyline = this.game.moneylineAway;
      }
      this.calculatePotentialWinnings();
    });
  }

  calculatePotentialWinnings() {
    const betType = this.betForm.get('betType')?.value;
    const wagerAmount = this.betForm.get('wagerAmount')?.value || 0;

    if (!betType || !wagerAmount) {
      this.potentialWinnings = 0;
      return;
    }

    switch (betType) {
      case BetTypes.MONEYLINE:
        if (this.selectedTeamMoneyline > 0) {
          // Positive moneyline: Risk $100 to win $moneyline
          this.potentialWinnings = (wagerAmount * this.selectedTeamMoneyline) / 100;
        } else {
          // Negative moneyline: Risk $|moneyline| to win $100
          this.potentialWinnings = (wagerAmount * 100) / Math.abs(this.selectedTeamMoneyline);
        }
        break;

      case BetTypes.POINT_SPREAD:
      case BetTypes.OVER_UNDER:
        // Standard -110 odds for spread and over/under bets
        this.potentialWinnings = (wagerAmount * 100) / 110;
        break;
    }

    this.potentialWinnings = Math.round(this.potentialWinnings * 100) / 100;
  }

  private balanceValidator() {
    return (control: FormControl<number | null>) => {
      if (!control.value) return null;
      const wagerAmount = control.value;
      const currentBalance = this.currentBalance;
      return currentBalance - wagerAmount < 0 ? { insufficientFunds: true } : null;
    };
  }

  async onSubmit() {
    if (this.betForm.valid) {
      try {
        const uid = await this.auth.getUID();
        if (!uid) return;

        const formValue = this.betForm.value;
        const bet = new BetHistory();
        bet.gameId = this.game.id;
        bet.userId = uid;
        bet.betType = formValue.betType as BetTypes;
        bet.sport = this.sportType;
        bet.gameStart = new Date(this.game.scheduled);
        bet.wagerValue = Number(formValue.wagerValue);
        bet.wagerAmount = Number(formValue.wagerAmount);
        bet.homeTeam = this.game.homeTeam.name;
        bet.awayTeam = this.game.awayTeam.name;
        bet.selectedTeam = formValue.selectedTeam as string;
        bet.potentialWinnings = this.potentialWinnings;

        this.gameService.addHistory(bet).subscribe({
          next: (newBalance) => {
            const updatedGame = { ...this.game, betSettlement: bet };
            this.betPlaced.emit({ game: updatedGame, balance: newBalance });
            this.activeModal.close();
          },
          error: (error) => console.error('Error placing bet:', error)
        });
      } catch (error) {
        console.error('Error during bet submission:', error);
      }
    } else {
      Object.keys(this.betForm.controls).forEach(key => {
        this.betForm.get(key)?.markAsTouched();
      });
    }
  }
}

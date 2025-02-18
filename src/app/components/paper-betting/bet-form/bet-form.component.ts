import {Component, EventEmitter, Input, Output, signal, Signal, WritableSignal} from '@angular/core';
import {Game} from "../../../shared/model/paper-betting/Game";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MdbRangeModule} from "mdb-angular-ui-kit/range";
import {CurrencyPipe, NgForOf, NgIf, NgSwitch, NgSwitchCase} from "@angular/common";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {BetSettlementService} from "../../../shared/services/betSettlement.service";
import {BetTypes} from "../../../shared/model/enums/BetTypes";
import {BetFormData} from "../../../shared/model/paper-betting/BetFormData";
import {SportType} from "../../../shared/model/SportType";
import {AuthService} from "../../../shared/services/auth.service";
import {firstValueFrom} from "rxjs";
import {BetHistory} from "../../../shared/model/paper-betting/BetHistory";
import {toSignal} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-bet-form',
  standalone: true,
  imports: [
    MdbRangeModule,
    NgSwitch,
    ReactiveFormsModule,
    NgForOf,
    NgSwitchCase,
    NgIf,
    CurrencyPipe
  ],
  templateUrl: './bet-form.component.html',
  styleUrl: './bet-form.component.scss'
})
export class BetFormComponent {
  @Input() game!: Game;
  @Input() sportType!: SportType;
  @Output() betPlaced = new EventEmitter<{game: Game, balance: number}>();

  betTypes = [
    { type: BetTypes.MONEYLINE, displayValue: 'Moneyline' },
    { type: BetTypes.POINT_SPREAD, displayValue: 'Point Spread' },
    { type: BetTypes.OVER_UNDER, displayValue: 'Over/Under' }
  ];

  formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  balance: Signal<number | undefined> = signal<number>(0);
  readonly BetTypes = BetTypes;

  betForm: FormGroup<{
    betType: FormControl<BetTypes | null>;
    wagerValue: FormControl<number | null>;
    wagerAmount: FormControl<number | null>;
  }>;

  constructor(
      private fb: FormBuilder,
      private gameService: BetSettlementService,
      private auth: AuthService,
      public activeModal: NgbActiveModal
  ) {
    this.balance = signal(this.gameService.account().balance)
    this.betForm = this.fb.group<{
      betType: FormControl<BetTypes | null>;
      wagerValue: FormControl<number | null>;
      wagerAmount: FormControl<number | null>;
    }>({
      betType: this.fb.control<BetTypes | null>(null, Validators.required),
      wagerValue: this.fb.control<number | null>(null, Validators.required),
      wagerAmount: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(0),
        Validators.max(5000),
        this.balanceValidator()
      ])


    });

    this.betForm.get('betType')?.valueChanges.subscribe(() => {
      this.betForm.get('wagerValue')?.reset();
    });

    //this.initializeBalance();
  }

  private balanceValidator() {
    return (control: FormControl<number | null>) => {
      if (!control.value) return null;

      const wagerAmount = control.value;
      const currentBalance = this.balance();

      if (currentBalance - wagerAmount < 0) {
        return { insufficientFunds: true };
      }

      return null;
    };
  }


  // private async initializeBalance(): Promise<void> {
  //   try {
  //     const uid = await this.auth.getUID();
  //     if (uid) {
  //       const balance = await firstValueFrom(this.gameService.getBalance(uid));
  //       this.balance.set(balance);
  //       // Revalidate wagerAmount when balance changes
  //       this.betForm.get('wagerAmount')?.updateValueAndValidity();
  //     }
  //   } catch (error) {
  //     console.error('Error fetching balance:', error);
  //     this.balance.set(0);
  //   }
  // }

  async onSubmit() {
    if (this.betForm.valid) {
      try {
        const uid = await this.auth.getUID();
        if (!uid) {
          console.error('No UID available for placing bet');
          return;
        }

        const formValue = this.betForm.value;
        const wagerAmount = Number(formValue.wagerAmount);

        // Double-check balance before submitting
        if (this.balance() - wagerAmount < 0) {
          this.betForm.get('wagerAmount')?.setErrors({ insufficientFunds: true });
          return;
        }

        const bet = new BetHistory();
        bet.gameId = this.game.id;
        bet.userId = uid;
        bet.betType = formValue.betType as BetTypes;
        bet.sport = this.sportType;
        bet.gameStart = new Date(this.game.scheduled);
        bet.wagerValue = Number(formValue.wagerValue);
        bet.wagerAmount = wagerAmount;
        bet.homeTeam = this.game.homeTeam.name;
        bet.awayTeam = this.game.awayTeam.name;

        this.gameService.addHistory(bet).subscribe({
          next: (newBalance) => {
            // Update the game with the new bet
            const updatedGame = { ...this.game, betSettlement: bet };
            // Emit both the updated game and new balance
            this.betPlaced.emit({ game: updatedGame, balance: newBalance });
            this.activeModal.close();
          },
          error: (error) => {
            console.error('Error placing bet:', error);
          }
        });
      } catch (error) {
        console.error('Error during bet submission:', error);
      }
    } else {
      Object.keys(this.betForm.controls).forEach(key => {
        const control = this.betForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}

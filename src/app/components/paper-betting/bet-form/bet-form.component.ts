import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Game} from "../../../shared/model/paper-betting/Game";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MdbRangeModule} from "mdb-angular-ui-kit/range";
import {NgForOf, NgIf, NgSwitch, NgSwitchCase} from "@angular/common";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {GameService} from "../../../shared/services/game.service";
import {BetTypes} from "../../../shared/model/enums/BetTypes";
import {BetFormData} from "../../../shared/model/paper-betting/BetFormData";

@Component({
  selector: 'app-bet-form',
  standalone: true,
  imports: [
    MdbRangeModule,
    NgSwitch,
    ReactiveFormsModule,
    NgForOf,
    NgSwitchCase,
    NgIf
  ],
  templateUrl: './bet-form.component.html',
  styleUrl: './bet-form.component.scss'
})
export class BetFormComponent {
  @Input() game!: Game;

  betTypes = [
    { type: BetTypes.MONEYLINE, displayValue: 'Moneyline' },
    { type: BetTypes.POINT_SPREAD, displayValue: 'Point Spread' },
    { type: BetTypes.OVER_UNDER, displayValue: 'Over/Under' }
  ];

  readonly BetTypes = BetTypes;

  betForm: FormGroup<{
    betType: FormControl<BetTypes | null>;
    wagerValue: FormControl<number | null>;
    wagerAmount: FormControl<number | null>;
  }>;

  constructor(
      private fb: FormBuilder,
      private gameService: GameService,
      public activeModal: NgbActiveModal
  ) {
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
        Validators.max(5000)
      ])
    });

    this.betForm.get('betType')?.valueChanges.subscribe(() => {
      this.betForm.get('wagerValue')?.reset();
    });
  }

  onSubmit() {
    if (this.betForm.valid) {
      const formValue = this.betForm.value as BetFormData;
      this.activeModal.close(formValue);
    }
  }
}

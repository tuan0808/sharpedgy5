// bet-form.component.ts
import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Game} from "../../../shared/model/paper-betting/Game";
import {BetTypes} from "../../../shared/model/enums/BetTypes";
import {SportType} from "../../../shared/model/SportType";
import {BetHistory} from "../../../shared/model/paper-betting/BetHistory";
import {BetSettlementService} from "../../../shared/services/betSettlement.service";
import {AuthService} from "../../../shared/services/auth.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Status} from "../../../shared/model/enums/Status";


interface BetTypeOption {
    id: BetTypes,
    label: string,
    icon: string
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
        ReactiveFormsModule,
    ],
    styleUrls: ['./bet-form.component.scss']
})
export class BetFormComponent {
    betSettlementService = inject(BetSettlementService);
    authService = inject(AuthService);

    @Input() game!: Game;
    @Input() uid: string;
    @Input() sportType!: SportType;
    @Output() betPlaced = new EventEmitter<{ game: Game, balance: number }>();

    bettingForm: FormGroup;
    selectedBetType = BetTypes.MONEYLINE;
    selectedTeam: any = null;
    potentialWinnings: number = 0;

    betTypes: BetTypeOption[] = [
        {id: BetTypes.MONEYLINE, label: 'Money Line', icon: '💰'},
        {id: BetTypes.POINT_SPREAD, label: 'Point Spread', icon: '📊'},
        {id: BetTypes.OVER_UNDER, label: 'Over/Under', icon: '⚖️'},
        {id: BetTypes.PARLAY, label: 'Parlay', icon: '🎲'},
        {id: BetTypes.TEASER, label: 'Teaser', icon: '🎯'},
        {id: BetTypes.ROUND_ROBIN, label: 'Round Robin', icon: '🔄'},
        {id: BetTypes.PLEASER, label: 'Pleaser', icon: '🎪'}
    ];

    constructor(
        private fb: FormBuilder,
        public activeModal: NgbActiveModal
    ) {
        this.bettingForm = this.fb.group({
            amount: ['', [Validators.required, Validators.min(0), Validators.max(5000)]]
        });
    }

    setSelectedBetType(betType: BetTypes): void {
        this.selectedBetType = betType;
        this.updatePotentialWinnings();
    }

    setSelectedTeam(team: any): void {
        this.selectedTeam = team;
        this.updatePotentialWinnings();
    }

    updatePotentialWinnings(): void {
        const amount = this.bettingForm.get('amount')?.value;
        if (!amount || !this.selectedTeam) {
            this.potentialWinnings = 0;
            return;
        }

        const odds = parseInt(this.selectedTeam.odds);
        if (odds > 0) {
            // Positive odds (e.g., +150)
            this.potentialWinnings = (amount * odds) / 100;
        } else {
            // Negative odds (e.g., -180)
            this.potentialWinnings = amount * (100 / Math.abs(odds));
        }
        this.potentialWinnings = Math.round(this.potentialWinnings * 100) / 100;
    }

    isFormValid(): boolean {
        return this.bettingForm.valid &&
            this.selectedTeam !== null &&
            this.bettingForm.get('amount')?.value > 0;
    }

    async onSubmit() {
        if (this.isFormValid()) {
            const betHistory = new BetHistory();
            betHistory.gameId = this.game.id;
            betHistory.userId = await this.authService.getUID()
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

            // Update the game with the new bet
            const updatedGame = {...this.game, betSettlement: betHistory};

            this.betSettlementService.addHistory(betHistory).subscribe(s => console.log(s))
            // Emit both game and balance (balance will be handled by the parent)
            //  this.betPlaced.emit({ game: updatedGame, balance: 0 });

            // Close the modal
            this.activeModal.close();
        }
    }
}

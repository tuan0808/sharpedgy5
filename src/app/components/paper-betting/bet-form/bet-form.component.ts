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
import {NgClass} from "@angular/common";


interface BetTypeOption {
    id: BetTypes,
    label: string,
    icon: string,
    isEnabled: boolean
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
        NgClass,
    ],
    styleUrls: ['./bet-form.component.scss']
})
export class BetFormComponent {
    protected betSettlementService = inject(BetSettlementService);
    protected authService = inject(AuthService);
    protected fb = inject(FormBuilder)
    public activeModal = inject(NgbActiveModal)


    @Input() game!: Game;
    @Input() uid: string = '';
    @Input() sportType!: SportType;
    @Output() betPlaced = new EventEmitter<{ game: Game, balance: number }>();

    bettingForm: FormGroup;
    selectedBetType = BetTypes.MONEYLINE;
    selectedTeam: any = null;
    potentialWinnings: number = 0;

    betTypes: BetTypeOption[] = [
        { id: BetTypes.MONEYLINE, label: 'Money Line', icon: '💰', isEnabled: true },
        { id: BetTypes.POINT_SPREAD, label: 'Point Spread', icon: '📊', isEnabled: true },
        { id: BetTypes.OVER_UNDER, label: 'Over/Under', icon: '⚖️', isEnabled: true },
        { id: BetTypes.PARLAY, label: 'Parlay', icon: '🎲', isEnabled: false },
        { id: BetTypes.TEASER, label: 'Teaser', icon: '🎯', isEnabled: false },
        { id: BetTypes.ROUND_ROBIN, label: 'Round Robin', icon: '🔄', isEnabled: false },
        { id: BetTypes.PLEASER, label: 'Pleaser', icon: '🎪', isEnabled: false }
    ];

    constructor() {
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

    async onSubmit() {
        if (this.isFormValid()) {
            const userId = this.uid || (await this.authService.getUID());
            if (!userId) {
                console.error('No user ID available');
                return;
            }

            const betHistory = new BetHistory();
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
            betHistory.status = Status.PENDING; // Optional, since it’s the default
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
}

import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {NgClass} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";
import {BaseBetFormComponent} from "../../../base-bet-form-component/base-bet-form-component.component";
import {AuthService} from "../../../../shared/services/auth.service";
import {BetSettlementService} from "../../../../shared/services/betSettlement.service";
import {SportType} from "../../../../shared/model/SportType";
import {Game} from "../../../../shared/model/paper-betting/Game";
import {PaperBetRecord} from "../../../../shared/model/paper-betting/PaperBetRecord";
import {Status} from "../../../../shared/model/enums/Status";

@Component({
    selector: 'app-bet-form',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass],
    templateUrl: './bet-form.component.html',
    styleUrls: ['./bet-form.component.scss']
})
export class BetFormComponent extends BaseBetFormComponent {
    protected betSettlementService = inject(BetSettlementService);
    protected authService = inject(AuthService);
    public activeModal = inject(NgbActiveModal);

    @Input() uid: string = '';
    @Input() sportType!: SportType;
    @Output() betPlaced = new EventEmitter<{ game: Game, balance: number }>();

    constructor() {
        super();
    }

    async onSubmit(): Promise<void> {
        if (this.isFormValid()) {
            const paperBetRecord = new PaperBetRecord();
            await this.submitBet(paperBetRecord);
        }
    }

    async submitBet(paperBetRecord: PaperBetRecord): Promise<void> {
        const userId = this.uid || (await this.authService.getUID());
        if (!userId) {
            console.error('No user ID available');
            return;
        }

        paperBetRecord.gameId = this.game.id;
        paperBetRecord.gameStart = new Date(this.game.scheduled);
        paperBetRecord.sport = this.sportType;
        paperBetRecord.betType = this.selectedBetType;
        paperBetRecord.wagerValue = parseFloat(this.selectedTeam.odds);
        paperBetRecord.wagerAmount = this.bettingForm.value.amount;
        paperBetRecord.amount = this.bettingForm.value.amount;
        paperBetRecord.status = Status.PENDING;
        paperBetRecord.selectedTeam = this.selectedTeam.name;
        paperBetRecord.potentialWinnings = this.potentialWinnings;

        const updatedGame = {...this.game, betSettlement: paperBetRecord};

        this.betSettlementService.addRecord(paperBetRecord)
        //.subscribe({
        //     next: (newBalance) => {
        //         console.log('Bet placed, new balance:', newBalance);
        //         this.betPlaced.emit({ game: updatedGame, balance: newBalance });
        //         this.activeModal.close();
        //     },
        //     error: (err) => console.error('Bet placement failed:', err)
        // });
    }
}

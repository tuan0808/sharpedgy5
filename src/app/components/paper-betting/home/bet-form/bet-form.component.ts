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
import {EventStatus} from "../../../../shared/model/enums/EventStatus";

interface OptimisticBet {
    tempId: string;
    paperBetRecord: PaperBetRecord;
    timestamp: number;
    status: 'pending' | 'confirmed' | 'failed';
}

interface BetPlacedEvent {
    game: Game;
    betRecord: PaperBetRecord;
    optimistic: boolean;
    success?: boolean;
}

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

    // Updated Output to emit bet placement events
    @Output() betPlaced = new EventEmitter<BetPlacedEvent>();

    private optimisticBets = new Map<string, OptimisticBet>();

    constructor() {
        super();
    }

    async onSubmit(): Promise<void> {
        if (this.isFormValid()) {
            const paperBetRecord = new PaperBetRecord();
            await this.submitBetOptimistically(paperBetRecord);
        }
    }

    private generateTempId(): string {
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async submitBetOptimistically(paperBetRecord: PaperBetRecord): Promise<void> {
        const userId = this.uid || (await this.authService.getUID());
        if (!userId) {
            console.error('No user ID available');
            return;
        }

        // Prepare the bet record
        paperBetRecord.gameId = this.game.id;
        paperBetRecord.userId = this.uid;
        paperBetRecord.sport = this.sportType;
        paperBetRecord.betType = this.selectedBetType;
        paperBetRecord.wagerValue = parseFloat(this.selectedTeam.odds);
        paperBetRecord.wagerAmount = this.bettingForm.value.amount;
        paperBetRecord.amount = this.bettingForm.value.amount;
        paperBetRecord.betStatus = EventStatus.PENDING;
        paperBetRecord.selectedTeam = this.selectedTeam.name;
        paperBetRecord.potentialWinnings = this.potentialWinnings;

        const tempId = this.generateTempId();

        // Create optimistic bet entry
        const optimisticBet: OptimisticBet = {
            tempId,
            paperBetRecord: { ...paperBetRecord },
            timestamp: Date.now(),
            status: 'pending'
        };

        this.optimisticBets.set(tempId, optimisticBet);

        // Create updated game with optimistic bet
        const updatedGame = { ...this.game, betSettlement: paperBetRecord };

        // Emit optimistic update immediately
        this.betPlaced.emit({
            game: updatedGame,
            betRecord: paperBetRecord,
            optimistic: true
        });

        // Update local state optimistically (if this method exists in your service)
        this.betSettlementService.addOptimisticBet?.(tempId, paperBetRecord);

        // Close modal immediately for better UX
        this.activeModal.close();

        // Submit to server in the background
        try {
            const result = await this.betSettlementService.addRecordOptimistic(paperBetRecord, this.uid, tempId);
            this.handleOptimisticSuccess(tempId, result, updatedGame);
        } catch (error) {
            this.handleOptimisticFailure(tempId, error, updatedGame);
        }
    }

    private handleOptimisticSuccess(tempId: string, serverResult: any, game: Game): void {
        const optimisticBet = this.optimisticBets.get(tempId);
        if (optimisticBet) {
            optimisticBet.status = 'confirmed';

            // Update bet record with server response data if needed
            const confirmedBetRecord = { ...optimisticBet.paperBetRecord };
            if (serverResult.betRecord) {
                Object.assign(confirmedBetRecord, serverResult.betRecord);
            }

            // Emit confirmed bet event
            this.betPlaced.emit({
                game: { ...game, betSettlement: confirmedBetRecord },
                betRecord: confirmedBetRecord,
                optimistic: false,
                success: true
            });

            // Server confirmation - update service state if method exists
            this.betSettlementService.confirmOptimisticBet?.(tempId, serverResult);

            console.log('Bet confirmed on server:', serverResult);

            // Clean up after a delay
            setTimeout(() => {
                this.optimisticBets.delete(tempId);
            }, 5000);
        }
    }

    private handleOptimisticFailure(tempId: string, error: any, game: Game): void {
        const optimisticBet = this.optimisticBets.get(tempId);
        if (optimisticBet) {
            optimisticBet.status = 'failed';

            // Create failed bet record
            const failedBetRecord = {
                ...optimisticBet.paperBetRecord,
                betStatus: EventStatus.FAILED
            };

            // Emit failure event
            this.betPlaced.emit({
                game: { ...game, betSettlement: null }, // Remove bet from game
                betRecord: failedBetRecord,
                optimistic: false,
                success: false
            });

            // Rollback the optimistic update in service if method exists
            this.betSettlementService.rollbackOptimisticBet?.(tempId);

            // Show error to user
            console.error('Bet placement failed:', error);
            this.showBetFailureNotification(error);

            // Clean up
            setTimeout(() => {
                this.optimisticBets.delete(tempId);
            }, 1000);
        }
    }

    private showBetFailureNotification(error: any): void {
        // Implement your notification system here
        // Could be a toast, snackbar, or modal
        console.warn('Bet could not be placed:', error);
    }
}

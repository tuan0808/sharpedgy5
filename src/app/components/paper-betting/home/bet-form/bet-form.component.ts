import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {NgClass} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";
import {BaseBetFormComponent} from "../../../base-bet-form-component/base-bet-form-component.component";
import {SportType} from "../../../../shared/model/SportType";
import {BetTypes} from "../../../../shared/model/enums/BetTypes";
import {BetSettlement} from "../../../../shared/model/paper-betting/BetSettlement";
import {EventStatus} from "../../../../shared/model/enums/EventStatus";

@Component({
    selector: 'app-bet-form',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass],
    templateUrl: './bet-form.component.html',
    styleUrls: ['./bet-form.component.scss']
})
export class BetFormComponent extends BaseBetFormComponent {
    public activeModal = inject(NgbActiveModal);

    @Input() uid: string = '';
    @Input() sportType!: SportType;

    // Emit BetSettlement instead of BetSubmissionData
    @Output() betDataSubmitted = new EventEmitter<BetSettlement>();

    constructor() {
        super();
    }

    onSubmit(): void {
        if (this.isFormValid()) {
            const betData = new BetSettlement();
            betData.betType = this.selectedBetType;
            betData.selectedTeam =  this.selectedTeam.name; // Convert team name/id to number
            betData.wagerValue = parseFloat(this.selectedTeam.odds);
            betData.wagerAmount = this.bettingForm.value.amount;
            betData.status = EventStatus.PENDING;


            // Emit BetSettlement and close modal
            this.betDataSubmitted.emit(betData);
            this.activeModal.close(betData);
        }
    }

    getFormData(): BetSettlement | null {
        if (this.isFormValid()) {
            const betData = new BetSettlement();
            betData.betType = this.selectedBetType;
            betData.selectedTeam = this.selectedTeam;
            betData.wagerValue = parseFloat(this.selectedTeam.odds);
            betData.wagerAmount = this.bettingForm.value.amount;
            betData.status = EventStatus.PENDING;
            return betData;
        }
        return null;
    }
}

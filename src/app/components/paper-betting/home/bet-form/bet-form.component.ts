// bet-form.component.ts
import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Game} from "../../../../shared/model/paper-betting/Game";
import {BetTypes} from "../../../../shared/model/enums/BetTypes";
import {SportType} from "../../../../shared/model/SportType";
import {BetHistory} from "../../../../shared/model/paper-betting/BetHistory";
import {BetSettlementService} from "../../../../shared/services/betSettlement.service";
import {AuthService} from "../../../../shared/services/auth.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Status} from "../../../../shared/model/enums/Status";
import {NgClass} from "@angular/common";
import {BaseBetFormComponent} from "../../../base-bet-form-component/base-bet-form-component.component";


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
export class BetFormComponent extends BaseBetFormComponent {
    constructor() {
        super();
    }

    async onSubmit(): Promise<void> {
        if (this.isFormValid()) {
            const betHistory = new BetHistory();
            await this.submitBet(betHistory);
        }
    }
}

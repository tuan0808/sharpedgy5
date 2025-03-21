import {Component, EventEmitter, inject, input, Input, Output, signal, Signal} from '@angular/core';
import {Game} from "../../../../shared/model/paper-betting/Game";
import {RouterLink} from "@angular/router";
import {DatePipe, NgClass, NgIf} from "@angular/common";
import {BetFormComponent} from "../../bet-form/bet-form.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BetTypes} from "../../../../shared/model/enums/BetTypes";
import {SportType} from "../../../../shared/model/SportType";
import {BetSettlementService} from "../../../../shared/services/betSettlement.service";

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    BetFormComponent,
    NgIf,
    NgClass
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.scss'
})
export class GameCardComponent {
  private modalService = inject(NgbModal)
  private betSettlementService = inject(BetSettlementService)
  gameData = input.required<Game>();
  sportType = input.required<SportType>();
  @Output() betPlaced = new EventEmitter<{ game: Game, balance: number }>();

  constructor () {}

  placePaperBet() {
    const modalRef = this.modalService.open(BetFormComponent);
    modalRef.componentInstance.game = this.gameData();
    modalRef.componentInstance.sportType = this.sportType();
    modalRef.componentInstance.uid = this.betSettlementService.currentUserId() || ''; // Pass userId

    modalRef.componentInstance.betPlaced.subscribe((result: { game: Game, balance: number }) => {
      this.betPlaced.emit(result);
    });
  }

  viewMatchupDetails() {
    console.log('Viewing Matchup Details', this.gameData());
  }

  protected readonly BetTypes = BetTypes;
}

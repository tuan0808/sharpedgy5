import {Component, EventEmitter, input, Input, Output, signal, Signal} from '@angular/core';
import {Game} from "../../../../shared/model/paper-betting/Game";
import {RouterLink} from "@angular/router";
import {NFLGame} from "../../../../shared/model/paper-betting/ b23/NFLGame";
import {DatePipe, NgIf} from "@angular/common";
import {BetFormComponent} from "../../bet-form/bet-form.component";
import {getDatabase} from "@angular/fire/database";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BetFormData} from "../../../../shared/model/paper-betting/BetFormData";
import {BetTypes} from "../../../../shared/model/enums/BetTypes";
import {SportType} from "../../../../shared/model/SportType";

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    BetFormComponent,
    NgIf
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.scss'
})
export class GameCardComponent {
  gameData = input.required<Game>();
  sportType = input.required<SportType>();
  @Output() betPlaced = new EventEmitter<{game: Game, balance: number}>();

  constructor(private modalService: NgbModal) {}

  placePaperBet() {
    const modalRef = this.modalService.open(BetFormComponent);
    modalRef.componentInstance.game = this.gameData();
    modalRef.componentInstance.sportType = this.sportType();

    // Subscribe to betPlaced event from BetFormComponent
    modalRef.componentInstance.betPlaced.subscribe((result: {game: Game, balance: number}) => {
      this.betPlaced.emit(result);
    });
  }

  viewMatchupDetails() {
    console.log('Viewing Matchup Details', this.gameData());
  }

  getImageByName(name: string): string {
    return `./assets/images/NFL/${name.concat('_', '_')}_logo.svg`;
  }

  protected readonly BetTypes = BetTypes;
}

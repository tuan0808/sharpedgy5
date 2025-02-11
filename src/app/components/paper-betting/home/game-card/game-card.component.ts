import {Component, EventEmitter, input, Input, Output, signal, Signal} from '@angular/core';
import {Game} from "../../../../shared/model/paper-betting/Game";
import {RouterLink} from "@angular/router";
import {NFLGame} from "../../../../shared/model/paper-betting/ b23/NFLGame";
import {DatePipe, NgIf} from "@angular/common";
import {BetFormComponent} from "../../bet-form/bet-form.component";
import {getDatabase} from "@angular/fire/database";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BetFormData} from "../../../../shared/model/paper-betting/BetFormData";

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
  currentBet = signal<BetFormData | null>(null);
  @Output() betClick = new EventEmitter<BetFormData>();

  constructor(private modalService: NgbModal) {}

  placePaperBet() {
    const modalRef = this.modalService.open(BetFormComponent);
    modalRef.componentInstance.game = this.gameData();

    modalRef.result.then((betData: BetFormData) => {
      this.currentBet.set(betData);
      // Emit the form data directly
      this.betClick.emit(betData);
    }, (reason) => {
      console.log('Modal dismissed');
    });
  }

  viewMatchupDetails() {
    console.log('Viewing Matchup Details', this.gameData());
  }

  getImageByName(name: string): string {
    return `./assets/images/NFL/${name.concat('_', '_')}_logo.svg`;
  }
}

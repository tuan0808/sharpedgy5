import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ScheduledGame} from "../../../shared/model/notifications/ScheduledGame";

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.scss'
})
export class GameCardComponent {  @Input() game!: ScheduledGame;
  @Input() gameData!: ScheduledGame;
  @Input() isActive = false;
  @Input() darkMode = false;
  @Output() gameClick = new EventEmitter<ScheduledGame>();

  getCardClass(): string {
    return `game-card ${this.darkMode ? 'dark' : 'light'}`;
  }

  getTimeClass(): string {
    const baseClass = 'game-time';
    if (this.isActive) {
      return `${baseClass} live`;
    }
    return `${baseClass} upcoming ${this.darkMode ? 'dark' : 'light'}`;
  }

  getHoverTextClass(): string {
    return `hover-text ${this.darkMode ? 'dark' : 'light'}`;
  }

  getTeamNameClass(): string {
    return `team-name ${this.darkMode ? 'dark' : 'light'}`;
  }

  getTeamScoreClass(): string {
    return `team-score ${this.darkMode ? 'dark' : 'light'}`;
  }

  getVersusClass(): string {
    return `versus ${this.darkMode ? 'dark' : 'light'}`;
  }

  onClick(): void {
    this.gameClick.emit(this.gameData);
  }
}

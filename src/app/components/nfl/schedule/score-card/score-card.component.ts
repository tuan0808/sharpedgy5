import {Component, Input} from '@angular/core';
import {GameData} from "../Schedule.component";
import {NgClass, NgForOf, NgIf} from "@angular/common";

@Component({
    selector: 'app-score-card',
    imports: [
        NgClass,
        NgForOf,
        NgIf
    ],
    templateUrl: './score-card.component.html',
    styleUrl: './score-card.component.scss'
})
export class ScoreCardComponent {
  @Input() gameData!: GameData;

  readonly quarterHeaders = ['1', '2', '3', '4', 'T'];

  getTeamName(abbr: string): string {
    const teamNames: { [key: string]: string } = {
      'PHI': 'Eagles',
      'KC': 'Chiefs',
      'BAL': 'Ravens',
      'CIN': 'Bengals',
      'DAL': 'Cowboys',
      'NYG': 'Giants'
    };
    return teamNames[abbr] || '';
  }
}

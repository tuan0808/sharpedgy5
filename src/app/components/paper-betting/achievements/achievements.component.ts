import {Component, computed, signal, Signal} from '@angular/core';
import {Achievement} from "../../../shared/model/paper-betting/Achievement";
import achievements from "../../../../assets/achievements.json"
import {DatePipe} from "@angular/common";

@Component({
    selector: 'app-achievements',
    imports: [
        DatePipe
    ],
    templateUrl: './achievements.component.html',
    styleUrl: './achievements.component.scss'
})
export class AchievementsComponent {
  achievements = achievements as Achievement[];

  overallProgress: Signal<number> = computed(() => {
    return Math.round(
        achievements.reduce((acc, curr) => acc + curr.progress, 0) / achievements.length
    );
  });

  getRarityClass(rarity: string): string {
    switch (rarity.toLowerCase()) {
      case 'common': return 'rarity-common';
      case 'rare': return 'rarity-rare';
      case 'epic': return 'rarity-epic';
      case 'legendary': return 'rarity-legendary';
      default: return 'rarity-common';
    }
  }
}

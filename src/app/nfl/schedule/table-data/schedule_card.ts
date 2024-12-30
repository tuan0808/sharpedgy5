import {ChangeDetectionStrategy, Component, computed, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DatePipe, NgClass, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import * as console from "console";
import nflData from '../../../../assets/data/NFLTeams.json'

@Component({
  selector: 'app-table-data',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    NgClass,
    NgOptimizedImage,
    DatePipe
  ],
  templateUrl: './schedule_card.html',
  styleUrl: './schedule_card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Schedule_card {
  @Input()
  game : any
  @Input() scoreData!: any;

  homeTeam = computed(() => {
    return nflData.find(f=>f.Abbreviation === this.game.home_team)
  });


  printGame(game: any) : string {
    return ''
  }
}

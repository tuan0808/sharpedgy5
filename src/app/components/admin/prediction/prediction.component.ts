import {Component, computed, effect, HostListener, inject, signal} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {CurrencyPipe, NgForOf, NgIf} from "@angular/common";
import {GameCardComponent} from "../../paper-betting/home/game-card/game-card.component";
import {PaginationComponent} from "../../../shared/components/pagination/pagination.component";
import {firstValueFrom, Observable, of, retry, timeout} from "rxjs";
import {BetSettlement} from "../../../shared/model/paper-betting/BetSettlement";
import {Game} from "../../../shared/model/paper-betting/Game";
import {HttpClient} from "@angular/common/http";
import {Team} from "../../../shared/model/paper-betting/Team";
import {BetTypes} from "../../../shared/model/enums/BetTypes";
import {BetFormComponent} from "../../paper-betting/home/bet-form/bet-form.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {PredictionFormComponent} from "./prediction-form/prediction-form.component";


@Component({
  selector: 'app-prediction',
  standalone: true,
    imports: [
        FormsModule,
        NgIf,
        NgForOf,
        CurrencyPipe,
        GameCardComponent,
        PaginationComponent
    ],
  templateUrl: './prediction.component.html',
  styleUrl: './prediction.component.scss'
})
export class PredictionComponent {
  modalService = inject(NgbModal)
  expandedGame: string | null = null;
  games: any[] = []; // Use any[] to avoid TypeScript errors
  BetTypes = BetTypes; // Make enum available to the template

  // Bet type mapping to display names
  betTypeNames: {[key: number]: string} = {
    [BetTypes.MONEYLINE]: 'Moneyline',
    [BetTypes.POINT_SPREAD]: 'Point Spread',
    [BetTypes.OVER_UNDER]: 'Over/Under',
    [BetTypes.SPREAD]: 'Spread',
    [BetTypes.TOTAL]: 'Total',
    [BetTypes.PARLAY]: 'Parlay',
    [BetTypes.TEASER]: 'Teaser',
    [BetTypes.ROUND_ROBIN]: 'Round Robin',
    [BetTypes.PLEASER]: 'Pleaser'
  };
  private gameType: any;

  constructor() {}

  ngOnInit() {
    // Initialize with mock data that matches your interfaces
    this.games = [
      {
        id: '1',
        status: 'No active bets placed',
        scheduled: '2025-04-22T18:00:00Z',
        venue: 'NRG Stadium, Houston, Texas',
        homeTeam: {
          id: 'hou',
          name: 'Houston Texans',
          logo: '🏈'
        },
        awayTeam: {
          id: 'ari',
          name: 'Arizona Cardinals',
          logo: '🏈'
        },
        favorite: 'home',
        spread: 3.54,
        moneylineHome: 215,
        moneylineAway: -111,
        overUnderTotal: 47.5,
        betSettlement: {
          betType: BetTypes.MONEYLINE,
          wagerValue: 215,
          wagerAmount: 100,
          comment: 'Home team looks strong',
          selectedTeam: 'home',
          confidence: 75 // As percentage
        }
      },
      {
        id: '2',
        status: 'No active bets placed',
        scheduled: '2025-04-20T19:30:00Z',
        venue: 'Lucas Oil Stadium, Indianapolis, Indiana',
        homeTeam: {
          id: 'ind',
          name: 'Indianapolis Colts',
          logo: '🏈'
        },
        awayTeam: {
          id: 'ten',
          name: 'Tennessee Titans',
          logo: '🏈'
        },
        favorite: 'home',
        spread: 6.74,
        moneylineHome: 227,
        moneylineAway: -210,
        overUnderTotal: 45.0,
        betSettlement: {
          betType: BetTypes.SPREAD,
          wagerValue: 6.74,
          wagerAmount: 50,
          comment: 'Big spread, but home team should cover',
          selectedTeam: 'home',
          confidence: 85 // As percentage
        }
      }
    ];
  }

  toggleAccordion(gameId: string): void {
    if (this.expandedGame === gameId) {
      this.expandedGame = null;
    } else {
      this.expandedGame = gameId;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  placeBet(gameId: string, event: Event): void {
    event.stopPropagation();
    console.log(`Place bet for game ${gameId}`);
  }

  viewMatchup(gameId: string, event: Event): void {
    event.stopPropagation();
    console.log(`View matchup for game ${gameId}`);
  }

  editGame(gameId: string, event: Event): void {
    event.stopPropagation();
    console.log(`Edit game ${gameId}`);
  }

  // Helper methods for bet results
  getBetTypeName(betTypeId: number): string {
    return this.betTypeNames[betTypeId] || 'Unknown';
  }

  submitPrediction(game : Game, event) {
    const modalRef = this.modalService.open(PredictionFormComponent);
    modalRef.componentInstance.game = game
    modalRef.componentInstance.sportType = this.gameType
    modalRef.componentInstance.uid = ''; // Pass userId

    modalRef.componentInstance.betPlaced.subscribe((result: { game: Game, balance: number }) => {
     // this.betPlaced.emit(result);
    });
  }

  getSelectedTeam(game: any): string {
    if (!game.betSettlement || game.betSettlement.betType === undefined) {
      return 'None';
    }

    if (game.betSettlement.selectedTeam === 'home') {
      return game.homeTeam.name;
    } else if (game.betSettlement.selectedTeam === 'away') {
      return game.awayTeam.name;
    } else if (game.betSettlement.betType === BetTypes.OVER_UNDER ||
        game.betSettlement.betType === BetTypes.TOTAL) {
      return game.betSettlement.wagerValue > game.overUnderTotal ? 'Over' : 'Under';
    }

    return 'Unknown';
  }

  formatConfidence(confidence: number): string {
    return confidence ? `${confidence}%` : 'Not set';
  }
}

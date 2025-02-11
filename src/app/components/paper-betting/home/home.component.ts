import {Component, OnInit, Signal, signal} from '@angular/core';
import {MdbAccordionModule} from "mdb-angular-ui-kit/accordion";
import {GameCardComponent} from "./game-card/game-card.component";
import {SportType} from "../../../shared/model/SportType";
import {GameService} from "../../../shared/services/game.service";
import {Game} from "../../../shared/model/paper-betting/Game";
import {BehaviorSubject} from "rxjs";
import {DatePipe} from "@angular/common";
import {SportDetail} from "../../../shared/model/SportDetail";
import {PaginationComponent} from "../../../shared/components/pagination/pagination.component";
import {AuthService} from "../../../shared/services/auth.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {BetFormComponent} from "../bet-form/bet-form.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BetFormData} from "../../../shared/model/paper-betting/BetFormData";
import {BetHistory} from "../../../shared/model/paper-betting/BetHistory";
import {BetTypes} from "../../../shared/model/enums/BetTypes";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [
    MdbAccordionModule,
    GameCardComponent,
    DatePipe,
    PaginationComponent
  ],
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
// home.component.ts
  private gamesSubject = new BehaviorSubject<Game[]>([]);
  protected balance = signal<number>(0)
  protected sportsData = signal<Game[]>([]);
  protected displayedGames = signal<Game[]>([]);
  protected sports = signal<SportDetail[]>([
    new SportDetail("NFL", "🏈", SportType.NFL),
    new SportDetail("NHL", "🏒", SportType.NHL),
  ]);

  protected selectedSport = signal<SportType>(SportType.NHL);

  // Pagination state
  protected currentPage = signal<number>(1);
  protected pageSize = signal<number>(10);
  protected totalPages = signal<number>(1);

  constructor(
      private gameService: GameService,
      private auth: AuthService,
      private modalService: NgbModal
  ) {
  }

  async ngOnInit() {
    this.loadGames(SportType.NFL);
    this.gameService.getBalance(await this.auth.getUID()).subscribe({
      next: (value) => {
        console.log(value)
        this.balance.set(value);
      },
      error: (error) => {
        console.error('Error fetching balance:', error);
        this.balance.set(0);
      }
    });
  }

  private loadGames(sportType: SportType) {
    this.gameService.getSportsByNFL(sportType).subscribe({
      next: (games) => {
        this.sportsData.set(games);
        this.updatePagination();
      },
      error: (error) => {
        this.sportsData.set([]);
        this.updatePagination();
      }
    });
  }

  private updatePagination(): void {
    const allGames = this.sportsData();
    const totalItems = allGames.length;
    this.totalPages.set(Math.ceil(totalItems / this.pageSize()));

    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = Math.min(startIndex + this.pageSize(), totalItems);
    this.displayedGames.set(allGames.slice(startIndex, endIndex));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updatePagination();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.updatePagination();
  }

  onSportSelect(type: SportType) {
    this.selectedSport.set(type);
    this.currentPage.set(1);
    this.loadGames(type);
  }

  async onBetPlaced(game: Game, betFormData: BetFormData) {
    console.log(JSON.stringify(betFormData))
    let bet = new BetHistory()
    bet.id = 0
    bet.userId = await this.auth.getUID()
    bet.betType = betFormData.betType
    bet.sport = this.selectedSport()
    bet.datetime = new Date()
    bet.amount = betFormData.amount
    bet.homeTeam = game.homeTeam.name
    bet.awayTeam = game.awayTeam.name
    this.gameService.addHistory(bet)
    console.log('Hello World', JSON.stringify(bet));
  }
}


import {Component, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {MdbAccordionModule} from "mdb-angular-ui-kit/accordion";
import {GameCardComponent} from "./game-card/game-card.component";
import {SportType} from "../../../shared/model/SportType";
import {GameService} from "../../../shared/services/game.service";
import {Game} from "../../../shared/model/paper-betting/Game";
import {BehaviorSubject, firstValueFrom} from "rxjs";
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
  private gamesSubject = new BehaviorSubject<Game[]>([]);
  protected balance = signal<number>(0);
  protected sportsData = signal<Game[]>([]);
  protected recentBetHistory = signal<BetHistory[]>([]);
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
  ) {}

  async ngOnInit() {
    try {
      console.log('hi waiting for UID')
      // Wait for UID first
      const uid = await this.auth.getUID();
      console.log(uid)
      if (!uid) {
        console.error('No UID available');
        return;
      }

      // Execute all async operations in parallel
      await Promise.all([
        this.initializeGames(uid),
        this.initializeBalance(uid),
        this.initializeRecentBets(uid)
      ]);
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }

  private async initializeGames(uid: string): Promise<void> {
    try {
      const games = await firstValueFrom(this.gameService.getSportsByNFL(uid, this.selectedSport()));
      this.sportsData.set(games);
      this.updatePagination();
    } catch (error) {
      console.error('Error loading games:', error);
      this.sportsData.set([]);
      this.updatePagination();
    }
  }

  private async initializeBalance(uid: string): Promise<void> {
    try {
      const balance = await firstValueFrom(this.gameService.getBalance(uid));
      this.balance.set(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      this.balance.set(0);
    }
  }

  private async initializeRecentBets(uid: string): Promise<void> {
    try {
      const recentBets = await firstValueFrom(this.gameService.getRecentBetsByUid(uid));
      this.recentBetHistory.set(recentBets);
    } catch (error) {
      console.error('Error fetching recent bets:', error);
      this.recentBetHistory.set([]);
    }
  }

  private updatePagination(): void {
    const allGames = this.sportsData();
    const totalItems = allGames.length;
    this.totalPages.set(Math.ceil(totalItems / this.pageSize()));

    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = Math.min(startIndex + this.pageSize(), totalItems);
    this.displayedGames.set(allGames.slice(startIndex, endIndex));
  }

  async onSportSelect(type: SportType) {
    this.selectedSport.set(type);
    this.currentPage.set(1);
    const uid = await this.auth.getUID();
    if (uid) {
      await this.initializeGames(uid);
    }
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

  async onBetPlaced(game: Game, betFormData: BetFormData) {
    const uid = await this.auth.getUID();
    console.log(uid)
    if (!uid) {
      console.error('No UID available for placing bet');
      return;
    }

    const bet = new BetHistory();
    bet.id = game.gameId;
    bet.userId = uid;
    bet.betType = betFormData.betType;
    bet.sport = this.selectedSport();
    bet.datetime = new Date();
    bet.wagerValue = betFormData.wagerValue
    bet.wagerValue = betFormData.wagerAmount;
    bet.homeTeam = game.homeTeam.name;
    bet.awayTeam = game.awayTeam.name;

    try {
      await this.gameService.addHistory(bet);
      // Optionally refresh recent bets after placing a new one
      await this.initializeRecentBets(uid);
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  }
}

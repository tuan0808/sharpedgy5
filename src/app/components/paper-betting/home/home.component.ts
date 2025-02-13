import {Component, inject, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {MdbAccordionModule} from "mdb-angular-ui-kit/accordion";
import {GameCardComponent} from "./game-card/game-card.component";
import {SportType} from "../../../shared/model/SportType";
import {BetSettlementService} from "../../../shared/services/betSettlement.service";
import {Game} from "../../../shared/model/paper-betting/Game";
import {BehaviorSubject, firstValueFrom, Observable, retry} from "rxjs";
import {CurrencyPipe, DatePipe} from "@angular/common";
import {SportDetail} from "../../../shared/model/SportDetail";
import {PaginationComponent} from "../../../shared/components/pagination/pagination.component";

import {BetHistory} from "../../../shared/model/paper-betting/BetHistory";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [
    MdbAccordionModule,
    GameCardComponent,
    DatePipe,
    PaginationComponent,
    CurrencyPipe
  ],
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  //injections:
  private gameService: BetSettlementService = inject(BetSettlementService)
  private httpClient : HttpClient = inject(HttpClient)

  //Behaviors
  private gamesSubject = new BehaviorSubject<Game[]>([]);


  //Signals
  protected sportsData = signal<Game[]>([]);
  protected recentBetHistory = signal<BetHistory[]>([]);
  protected displayedGames = signal<Game[]>([]);
  protected sports = signal<SportDetail[]>([
    new SportDetail("NFL", "🏈", SportType.NFL),
    new SportDetail("NHL", "🏒", SportType.NHL),
  ]);
  protected readonly showNotifications = signal<boolean>(false);
  protected selectedSport = signal<SportType>(SportType.NHL);
  protected balance: Signal<number>;

  // Pagination state
  protected currentPage = signal<number>(1);
  protected pageSize = signal<number>(10);
  protected totalPages = signal<number>(1);

  constructor(

  ) {
    this.balance = this.gameService.getCurrentBalance();
  }

  async ngOnInit() {
    try {
      await Promise.all([
        this.initializeGames(),
        this.initializeRecentBets()
      ]);
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }

  private async initializeGames(): Promise<void> {
    try {
      const games = await firstValueFrom(this.gameService.getSportsByNFL(this.selectedSport()));
      this.sportsData.set(games);
      this.updatePagination();
    } catch (error) {
      console.error('Error loading games:', error);
      this.sportsData.set([]);
      this.updatePagination();
    }
  }

  private async initializeRecentBets(): Promise<void> {
    try {
      const recentBets = await firstValueFrom(this.gameService.getRecentBetsByUid());
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
    await this.initializeGames();
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
}

import {Component, computed, inject, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {MdbAccordionModule} from "mdb-angular-ui-kit/accordion";
import {GameCardComponent} from "./game-card/game-card.component";
import {SportType} from "../../../shared/model/SportType";
import {BetSettlementService} from "../../../shared/services/betSettlement.service";
import {Game} from "../../../shared/model/paper-betting/Game";
import {BehaviorSubject, firstValueFrom, Observable, retry, timeout} from "rxjs";
import {CurrencyPipe, DatePipe} from "@angular/common";
import {SportDetail} from "../../../shared/model/SportDetail";
import {PaginationComponent} from "../../../shared/components/pagination/pagination.component";

import {BetHistory} from "../../../shared/model/paper-betting/BetHistory";
import {HttpClient} from "@angular/common/http";
import {catchError, filter, tap} from "rxjs/operators";

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
  private readonly betSettlement = inject(BetSettlementService);

  // Signals
  protected readonly account =  this.betSettlement.account;
  protected readonly displayedGames = signal<Game[]>([]);
  protected readonly sports = signal<SportDetail[]>([
    new SportDetail("NFL", "🏈", SportType.NFL),
    new SportDetail("NHL", "🏒", SportType.NHL),
  ]);
  protected readonly selectedSport = signal<SportType>(SportType.NFL);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);
  protected readonly totalPages = signal<number>(1);

  constructor() {
  }
  async ngOnInit(): Promise<void> {
    // Wait for user authentication
    while (!this.betSettlement.currentUserId()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await this.loadGames();
  }

  private async loadGames(): Promise<void> {
    try {
      this.isLoading.set(true);

      const gamesObservable = this.betSettlement.getSportsByNFL(this.selectedSport()).pipe(
          timeout(5000),
          retry(2),
          tap(games => console.log(`Retrieved ${games?.length} games`))
      );

      const games = await firstValueFrom(gamesObservable);
      this.updateGamesDisplay(Array.isArray(games) ? games : []);
    } catch (error) {
      console.error('Failed to load games:', error);
      this.updateGamesDisplay([]);
    } finally {
      this.isLoading.set(false);
    }
  }



  private updateGamesDisplay(games: Game[]): void {
    const totalGames = games.length;
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = Math.min(startIndex + this.pageSize(), totalGames);

    this.totalPages.set(Math.ceil(totalGames / this.pageSize()));
    this.displayedGames.set(games.slice(startIndex, endIndex));
  }

  // Event Handlers
  async onSportSelect(type: SportType): Promise<void> {
    if (this.selectedSport() === type && this.displayedGames().length > 0) {
      return;
    }

    this.selectedSport.set(type);
    this.currentPage.set(1);
    await this.loadGames();
  }

  async onPageChange(page: number): Promise<void> {
    this.currentPage.set(page);
    await this.loadGames();
  }

  async onPageSizeChange(size: number): Promise<void> {
    this.pageSize.set(size);
    this.currentPage.set(1);
    await this.loadGames();
  }
}

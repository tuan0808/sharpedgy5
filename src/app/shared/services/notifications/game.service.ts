import {computed, Injectable, signal} from '@angular/core';
import {ScheduledGame} from "../../model/notifications/ScheduledGame";
import {EventStatus} from '../../model/notifications/EventStatus';
import {SportType} from '../../model/SportType';
import {BaseService} from "../base.service";
import {Observable} from 'rxjs';
import {Page} from "../../model/notifications/Page";
import {map} from "rxjs/operators";

export interface GameFilters {
    sportType?: SportType;
    status?: EventStatus;
    date?: string;
    league?: string;
    page?: number;
    size?: number;
}

export interface GameUpdateRequest {
    status: EventStatus;
}

export interface LiveGameUpdate {
    gameId: string;
    homeScore: string;
    awayScore: string;
    timeRemaining: string;
    quarter: string;
    status: EventStatus;
    lastUpdated: string;
}

@Injectable({
    providedIn: 'root'
})
export class GameService extends BaseService<ScheduledGame> {
    private readonly _upcomingGames = signal<ScheduledGame[]>([]);
    private readonly _liveGames = signal<ScheduledGame[]>([]);
    private readonly _sports = signal<SportType[]>([]);

    readonly upcomingGames = this._upcomingGames.asReadonly();
    readonly liveGames = this._liveGames.asReadonly();
    readonly sports = this._sports.asReadonly();

    readonly allGames = computed(() => [
        ...this._upcomingGames(),
        ...this._liveGames()
    ]);

    constructor() {
        super();
        this.loadInitialData();
    }

    private async loadInitialData(): Promise<void> {
        try {
            await this.initializeUser();
            this.loadUpcomingGames();
            this.loadLiveGames();
            this.loadSports();
        } catch (error) {
            console.error('Failed to initialize game data:', error);
        }
    }

    getUpcomingGames(): Observable<Page<ScheduledGame> | null> {
        const url = `http://localhost:8080/games/upcoming`;
        return this.get<Page<ScheduledGame>>(url, 'Failed to load upcoming games').pipe(
            map(response => {
                if (response?.content) {
                    this._upcomingGames.set(response.content);
                }
                return response;
            })
        );
    }

    getLiveGames(): Observable<Page<ScheduledGame> | null> {
        const url = `${this.apiUrl}/games/live`;
        return this.get<Page<ScheduledGame>>(url, 'Failed to load live games').pipe(
            map(response => {
                if (response?.content) {
                    this._liveGames.set(response.content);
                }
                return response;
            })
        );
    }

    getSportTypes(): Observable<SportType[] | null> {
        const url = `${this.apiUrl}/games/sports`;
        return this.get<SportType[]>(url, 'Failed to load sports').pipe(
            map(sports => {
                if (sports) {
                    this._sports.set(sports);
                }
                return sports;
            })
        );
    }

    updateGameStatus(gameId: string, status: EventStatus): Observable<string> {
        const url = `${this.apiUrl}/games/${gameId}/status/${status}`;
        return this.post<string, {}>(url, {}, 'Failed to update game status');
    }

    refreshGames(): void {
        this.loadUpcomingGames();
        this.loadLiveGames();
    }

    private loadUpcomingGames(): void {
        this.getUpcomingGames().subscribe();
    }

    private loadLiveGames(): void {
        this.getLiveGames().subscribe();
    }

    private loadSports(): void {
        this.getSportTypes().subscribe();
    }
}

import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable, of, throwError, Subject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { Prediction } from '../model/Prediction';
import { Game } from '../model/paper-betting/Game';
import { BaseService } from './base.service';
import { environment } from '../../../environments/environment';
import { SportType } from '../model/SportType';

export interface PagedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
}

export interface GameUpdate {
    gameId: number;
    prediction?: Prediction;
    timestamp: number;
}

@Injectable({
    providedIn: 'root'
})
export class PredictionsService extends BaseService<Prediction> {
    protected override apiUrl = `${environment.apiUrl}/api`;

    // Predictions state
    readonly predictions = signal<Prediction[]>([]);
    readonly allGames = signal<Game[]>([]);
    readonly currentUserId = computed(() => this.userId());
    readonly isInitialized = signal<boolean>(false);

    // Game updates
    private gameUpdateSubject = new Subject<GameUpdate>();
    readonly gameUpdate$ = this.gameUpdateSubject.asObservable();

    constructor() {
        super();
        this.initializePredictions();
    }

    private async initializePredictions(): Promise<void> {
        try {
            const userId = await this.initializeUser();
            if (!userId) {
                console.warn('No user ID available');
                return;
            }

            await this.fetchInitialPredictions(userId);
            this.isInitialized.set(true);
        } catch (error) {
            console.error('Failed to initialize predictions:', error);
            this.isInitialized.set(false);
        }
    }

    async addRecordOptimistic(
        prediction: Prediction,
        userId: string,
        tempId?: string
    ): Promise<Prediction> {
        // Optimistically update the UI
        const optimisticPrediction = { ...prediction, id: -1, userId };

        // Add to predictions immediately
        this.predictions.update(predictions => [...predictions, optimisticPrediction]);

        // Update game immediately
        this.updateGameWithPrediction(optimisticPrediction);

        try {
            // Submit to server
            const result = await firstValueFrom(this.submitPrediction(prediction));

            // Replace optimistic prediction with real one
            this.predictions.update(predictions =>
                predictions.map(p => p.gameId === -1 ? result : p)
            );

            // Update game with real prediction
            this.updateGameWithPrediction(result);

            return result;
        } catch (error) {
            // Remove optimistic prediction on error
            this.predictions.update(predictions =>
                predictions.filter(p => p.gameId  !== -1)
            );

            // Revert game update
            this.allGames.update(games =>
                games.map(game =>
                    game.id === prediction.gameId
                        ? { ...game, hasPrediction: false, prediction: undefined }
                        : game
                )
            );

            throw error;
        }
    }

    private async fetchInitialPredictions(userId: string): Promise<void> {
        const initialPredictions = await firstValueFrom(
            this.getPredictions(userId).pipe(
                catchError((error) => {
                    console.error('Error fetching predictions:', error);
                    return of([]);
                })
            )
        );

        if (initialPredictions?.length) {
            this.predictions.set(initialPredictions);
        }
    }

    /**
     * Submit a prediction
     */
    submitPrediction(prediction: Prediction): Observable<Prediction> {
        const userId = this.userId();
        if (!userId) {
            return throwError(() => new Error('User not authenticated'));
        }

        const predictionWithUser = { ...prediction, userId };

        return this.post<Prediction, Prediction>(
            `${this.apiUrl}/predictions`,
            predictionWithUser,
            'Failed to submit prediction'
        ).pipe(
            map(response => {
                this.predictions.update(predictions => [...predictions, response]);
                this.updateGameWithPrediction(response);
                return response;
            })
        );
    }

    /**
     * Get predictions for user
     * FIXED: Now uses /predictions/recent/{userId} instead of trying to GET on /predictions
     */
    getPredictions(userId: string): Observable<Prediction[]> {
        return this.get<Prediction[]>(
            `${this.apiUrl}/predictions/recent/${userId}`,
            'Failed to load predictions'
        );
    }

    /**
     * Get paginated games from predictions endpoint
     * Uses /api/predictions/games/upcoming/{userId}
     */
    getUpcomingGamesPaginated(
        uid: string,
        league: SportType,
        page: number,
        resultsPerPage: number
    ): Observable<PagedResponse<Game>> {
        const leagueParam = this.convertSportTypeToLeague(league);
        const params = new HttpParams()
            .set('league', leagueParam)
            .set('page', page.toString())
            .set('size', resultsPerPage.toString());

        return this.get<PagedResponse<Game>>(
            `${this.apiUrl}/predictions/games/upcoming/${uid}`,
            'Failed to load games',
            { params }
        ).pipe(
            tap(response => console.log(`Loaded ${response.content.length} games`)),
            map(response => ({
                ...response,
                content: this.mergeGamesWithPredictions(response.content)
            })),
            catchError(error => {
                console.error(`Error loading games:`, error);
                throw error;
            })
        );
    }

    /**
     * Convert SportType to league string
     */
    private convertSportTypeToLeague(sportType: SportType): string {
        const mapping: Record<SportType, string> = {
            [SportType.NFL]: 'NFL',
            [SportType.NHL]: 'NHL',
            [SportType.NBA]: 'NBA',
            [SportType.MLB]: 'MLB',
            [SportType.ALL]: 'ALL',
            [SportType.MLS]: 'MLS',
            [SportType.EPL]: 'EPL',
            [SportType.UFC]: 'UFC',
            [SportType.PGA]: 'PGA',
            [SportType.WTA]: 'WTA',
            [SportType.NASCAR]: 'NASCAR',
            [SportType.NCAA_FOOTBALL]: 'NCAAF',
            [SportType.NCAA_BASKETBALL]: 'NCAAB',
            [SportType.SOCCER]: 'SOCCER'
        };
        return mapping[sportType] || 'NFL';
    }

    /**
     * Merge games with user's predictions
     */
    private mergeGamesWithPredictions(games: Game[]): Game[] {
        const userPredictions = this.predictions();
        if (!userPredictions.length) return games;

        const mergedGames = games.map(game => {
            const prediction = userPredictions.find(p => p.gameId === game.id);
            return prediction
                ? { ...game, hasPrediction: true, prediction }
                : game;
        });

        // Sync to allGames
        this.syncGames(mergedGames);

        return mergedGames;
    }

    /**
     * Sync games to allGames signal
     */
    private syncGames(games: Game[]): void {
        const currentGames = this.allGames();
        const updatedGames = [...currentGames];

        games.forEach(newGame => {
            const index = updatedGames.findIndex(g => g.id === newGame.id);
            if (index !== -1) {
                updatedGames[index] = newGame;
            } else {
                updatedGames.push(newGame);
            }
        });

        this.allGames.set(updatedGames);
    }

    /**
     * Update game with prediction
     */
    private updateGameWithPrediction(prediction: Prediction): void {
        this.allGames.update(games =>
            games.map(game =>
                game.id === prediction.gameId
                    ? { ...game, hasPrediction: true, prediction }
                    : game
            )
        );

        // Notify subscribers
        this.gameUpdateSubject.next({
            gameId: prediction.gameId,
            prediction,
            timestamp: Date.now()
        });
    }

    /**
     * Refresh predictions
     */
    async refreshPredictions(): Promise<void> {
        const userId = this.userId();
        if (userId) {
            await this.fetchInitialPredictions(userId);
        }
    }

    /**
     * WebSocket status (predictions don't use WebSocket)
     */
    isWebSocketActive(): boolean {
        return false;
    }
}

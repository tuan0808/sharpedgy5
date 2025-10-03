import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Prediction } from '../model/Prediction';
import { Game } from '../model/paper-betting/Game';
import { BaseService } from './base.service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PredictionsService extends BaseService<Prediction> {
    protected override apiUrl = `${environment.apiUrl}/predictions/v1`;

    // State signals
    readonly predictions = signal<Prediction[]>([]);
    readonly allGames = signal<Game[]>([]);
    readonly currentUserId = computed(() => this.userId());
    readonly isInitialized = signal<boolean>(false);

    constructor() {
        super();
        // Start initialization but don't await in constructor
        this.initializePredictions();
    }

    private async initializePredictions(): Promise<void> {
        try {
            const userId = await this.initializeUser();
            if (!userId) {
                console.warn('No user ID available for predictions');
                return;
            }

            await this.fetchInitialPredictions(userId);
            this.isInitialized.set(true);
        } catch (error) {
            console.error('Failed to initialize predictions:', error);
            this.isInitialized.set(false);
        }
    }

    /**
     * Wait for service to be ready before using
     * Components should call this in ngOnInit
     */
    async waitForInitialization(): Promise<void> {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.isInitialized()) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 10000);
        });
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

    submitPrediction(prediction: Prediction): Observable<Prediction> {
        const userId = this.userId();
        if (!userId) {
            this.errorMessage.set('User not authenticated');
            return throwError(() => new Error('User not authenticated'));
        }

        console.log(`Submitting prediction to: ${this.apiUrl}/${userId}/submit`);

        return this.post<Prediction, Prediction>(
            `${this.apiUrl}/${userId}/submit`,
            prediction,
            'Failed to submit prediction'
        ).pipe(
            map(response => {
                // Update predictions signal with new prediction
                this.predictions.update(predictions => [...predictions, response]);

                // Update the game in allGames to reflect the prediction
                this.updateGameWithPrediction(response);

                return response;
            })
        );
    }

    /**
     * Update a specific game to show it has a prediction
     */
    private updateGameWithPrediction(prediction: Prediction): void {
        this.allGames.update(games =>
            games.map(game =>
                game.id === prediction.gameId
                    ? { ...game, hasPrediction: true, prediction }
                    : game
            )
        );
    }

    getPredictions(userId: string): Observable<Prediction[]> {
        return this.get<Prediction[]>(
            `${this.apiUrl}/${userId}/predictions`,
            'Failed to load predictions'
        );
    }

    getGamesForPredictions(): Observable<Game[]> {
        const userId = this.userId();
        if (!userId) {
            this.errorMessage.set('User not authenticated');
            return of([]);
        }

        return this.get<Game[]>(
            `${this.apiUrl}/${userId}/games`,
            'Failed to load games'
        ).pipe(
            map(games => {
                this.allGames.set(games);
                return games;
            }),
            catchError(error => {
                console.error('Error loading games:', error);
                this.errorMessage.set('Failed to load games');
                return of([]);
            })
        );
    }

    /**
     * Get predictions for a specific game
     */
    getPredictionsForGame(gameId: number): Prediction[] {
        return this.predictions().filter(p => p.gameId === gameId);
    }

    /**
     * Refresh predictions from server
     */
    async refreshPredictions(): Promise<void> {
        const userId = this.userId();
        if (userId) {
            await this.fetchInitialPredictions(userId);
        }
    }
}

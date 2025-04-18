import { computed, Injectable, signal } from '@angular/core';
import {firstValueFrom, Observable, of, throwError} from 'rxjs';
import {  map, catchError } from 'rxjs/operators';
import { Prediction } from '../model/Prediction';
import { Game } from '../model/paper-betting/Game';
import { BaseService } from './base.service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PredictionsService extends BaseService<Prediction> {
    protected override apiUrl = `${environment.apiUrl}/predictions/v1`;
    readonly predictions = signal<Prediction[]>([]);
    readonly allGames = signal<Game[]>([]);
    readonly currentUserId = computed(() => this.userId());

    constructor() {
        super();
        this.initializePredictions();
    }

    private async initializePredictions(): Promise<void> {
        const userId = await this.initializeUser();
        if (!userId) return;

        await this.fetchInitialPredictions(userId);
        // Uncomment if WebSocket is needed
        // this.setupWebSocket(userId);
    }

    private async fetchInitialPredictions(userId: string): Promise<void> {
        const initialPredictions = await firstValueFrom(
            this.getPredictions(userId).pipe(
                catchError(() => of([]))
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
            this.isLoading.set(false);
            return throwError(() => new Error('User not authenticated'));
        }

        console.log(`Submitting prediction: ${this.apiUrl}/${userId}/submit`);
        return this.post<Prediction, Prediction>(
            `${this.apiUrl}/${userId}/submit`,
            prediction,
            'Failed to submit prediction'
        ).pipe(
            map(response => {
                this.predictions.update(predictions => [...predictions, response]);
                return response;
            })
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
            })
        );
    }
}

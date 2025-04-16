import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Prediction } from '../model/Prediction';
import { Game } from '../model/paper-betting/Game';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Dynamic WebSocket URL based on environment
const getWebSocketUrl = (): string => {
    const baseUrl = environment.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${baseUrl}/ws`; // Matches Spring Boot STOMP endpoint
};

@Injectable({
    providedIn: 'root'
})
export class PredictionsService extends BaseApiService<Prediction> {
    private readonly destroyRef = inject(DestroyRef);
    private readonly auth = inject(AuthService);
    private stompClient: Client | null = null; // STOMP client instance
    protected override apiUrl = `${environment.apiUrl}/predictions/v1`;

    readonly predictions = signal<Prediction[]>([]);
    readonly allGames = signal<Game[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly errorMessage = signal<string | null>(null);
    private readonly uid = signal<string | null>(null);

    readonly currentUserId = computed(() => this.uid());

    constructor() {
        super();
        this.initializeUser();
    }

    private async initializeUser(retryCount = 0): Promise<void> {
        try {
            this.isLoading.set(true);
            this.errorMessage.set(null);

            const userId = await Promise.race<string | null>([
                this.auth.getUID(),
                new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 5000)
                ),
            ]);

            if (!userId) {
                throw new Error('Failed to get user ID');
            }

            this.uid.set(userId);
            console.log('User initialized with ID:', userId);
            await this.fetchInitialPredictions(userId);
           // this.setupWebSocket(userId);
            this.isLoading.set(false);
        } catch (error) {
            console.error('Error initializing user:', error);
            this.errorMessage.set('Failed to initialize user');

            if (retryCount < 3) {
                this.errorMessage.set(`Retrying initialization (${retryCount + 1}/3)...`);
                await this.retryInitialize(retryCount);
            } else {
                console.error('Failed to initialize user after max retries');
                this.errorMessage.set('Failed to initialize after multiple attempts. Please refresh the page.');
                this.uid.set(null);
                this.isLoading.set(false);
            }
        }
    }

    private async fetchInitialPredictions(userId: string): Promise<void> {
        try {
            const initialPredictions = await firstValueFrom(
                this.getPredictions(userId).pipe(
                    catchError(error => {
                        console.error('Failed to get initial predictions:', error);
                        this.errorMessage.set('Could not load predictions');
                        return of([]);
                    })
                )
            );

            if (initialPredictions?.length) {
                this.predictions.set(initialPredictions);
                this.errorMessage.set(null);
            }
        } catch (error) {
            console.error('Error fetching initial predictions:', error);
            this.errorMessage.set('Failed to fetch predictions');
        }
    }

    private async retryInitialize(retryCount: number): Promise<void> {
        const delayMs = 2000 * Math.pow(1.5, retryCount); // Exponential backoff
        console.log(`Retry ${retryCount + 1} of 3 in ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.initializeUser(retryCount + 1);
    }

    // private async setupWebSocket(userId: string): Promise<void> {
    //     try {
    //         const token = await this.auth.getFreshToken();
    //         if (!token) {
    //             console.error('No token available for WebSocket connection');
    //             this.errorMessage.set('Authentication error');
    //             return;
    //         }
    //
    //         this.stompClient = new Client({
    //             webSocketFactory: () => new SockJS(getWebSocketUrl()),
    //             connectHeaders: {
    //                 Authorization: `Bearer ${token}`,
    //                 userId: userId
    //             },
    //             reconnectDelay: 2000,
    //             heartbeatIncoming: 4000,
    //             heartbeatOutgoing: 4000,
    //             onConnect: () => {
    //                 console.log('STOMP WebSocket connected for user:', userId);
    //                 this.errorMessage.set(null);
    //                 this.subscribeToUpdates(userId);
    //             },
    //             onStompError: (frame) => {
    //                 console.error('STOMP error:', frame);
    //                 this.errorMessage.set('Failed to connect to live updates');
    //             },
    //             onWebSocketClose: (event) => {
    //                 console.log('STOMP WebSocket disconnected:', event.reason);
    //                 this.errorMessage.set('Lost connection to live updates');
    //             }
    //         });
    //
    //         this.stompClient.activate();
    //
    //         this.destroyRef.onDestroy(() => {
    //             if (this.stompClient) {
    //                 this.stompClient.deactivate();
    //                 console.log('STOMP WebSocket disconnected due to service destruction');
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Failed to setup STOMP WebSocket:', error);
    //         this.errorMessage.set('WebSocket setup failed');
    //     }
    // }

    // private subscribeToUpdates(userId: string): void {
    //     if (!this.stompClient) return;
    //
    //     this.stompClient.subscribe(`/topic/predictionUpdate/${userId}`, (message) => {
    //         const prediction: Prediction = JSON.parse(message.body);
    //         console.log('Received prediction update:', prediction);
    //         this.predictions.update(predictions => {
    //             const index = predictions.findIndex(p => p.id === prediction.id);
    //             if (index !== -1) {
    //                 return [...predictions.slice(0, index), prediction, ...predictions.slice(index + 1)];
    //             }
    //             return [...predictions, prediction];
    //         });
    //     });
    //
    //     this.stompClient.subscribe('/topic/gameUpdate', (message) => {
    //         const game: Game = JSON.parse(message.body);
    //         console.log('Received game update:', game);
    //         this.allGames.update(games => {
    //             const index = games.findIndex(g => g.id === game.id);
    //             if (index !== -1) {
    //                 return [...games.slice(0, index), game, ...games.slice(index + 1)];
    //             }
    //             return [...predictions, game];
    //         });
    //     });
    // }

    submitPrediction(prediction: Prediction): Observable<Prediction> {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        const userId = this.uid();
        if (!userId) {
            this.errorMessage.set('User not authenticated');
            this.isLoading.set(false);
            return throwError(() => new Error('User not authenticated'));
        }

        console.log(`Submitting prediction: ${this.apiUrl}/${userId}/submit`);
        return this.http.post<Prediction>(`${this.apiUrl}/${userId}/submit`, prediction).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(response => {
                this.isLoading.set(false);
                this.errorMessage.set(null);
                this.predictions.update(predictions => [...predictions, response]);
                return response;
            }),
            catchError(error => {
                console.error('Error submitting prediction:', error);
                this.isLoading.set(false);
                this.errorMessage.set('Failed to submit prediction');
                return throwError(() => error);
            })
        );
    }

    getPredictions(userId: string): Observable<Prediction[]> {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        return this.http.get<Prediction[]>(`${this.apiUrl}/${userId}/predictions`, {
            withCredentials: true
        }).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(predictions => {
                this.isLoading.set(false);
                this.errorMessage.set(null);
                return predictions;
            }),
            catchError(error => {
                console.error('Error fetching predictions:', error);
                this.isLoading.set(false);
                this.errorMessage.set('Failed to load predictions');
                return of([]);
            })
        );
    }

    getGamesForPredictions(): Observable<Game[]> {
        const userId = this.uid();
        if (!userId) {
            this.errorMessage.set('User not authenticated');
            this.isLoading.set(false);
            return of([]);
        }

        this.isLoading.set(true);
        this.errorMessage.set(null);

        return this.http.get<Game[]>(`${this.apiUrl}/${userId}/games`, {
            withCredentials: true
        }).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(games => {
                this.isLoading.set(false);
                this.errorMessage.set(null);
                this.allGames.set(games);
                return games;
            }),
            catchError(error => {
                console.error('Error fetching games:', error);
                this.isLoading.set(false);
                this.errorMessage.set('Failed to load games');
                return of([]);
            })
        );
    }
}

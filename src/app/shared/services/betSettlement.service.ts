import {effect, inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {Game} from "../model/paper-betting/Game";
import {firstValueFrom, Observable, of, retry, Subject, takeUntil, throwError} from "rxjs";
import {catchError, map, tap} from "rxjs/operators";
import {BaseApiService} from "./base-api.service";
import {SportType} from "../model/SportType";
import {BetHistory} from "../model/paper-betting/BetHistory";
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {environment} from "../../../environments/environment";
import {BalanceWebhookResponse} from "../model/paper-betting/BalanceWebhookResponse";


interface Post {
    id: number;
    title: string;
    body: string;
}

interface RequestState<T> {
    loading: boolean;
    data: T | null;
    error: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class BetSettlementService extends BaseApiService<Game> {
    protected override apiUrl = 'http://localhost:8080/paper-betting/v1';
    protected webhookUrl = 'http://localhost:8080/webhooks/v1';
    private auth = inject(AuthService);
    private destroySubject = new Subject<void>();
    private readonly balance = signal<number>(0);
    private readonly uid = signal<string | null>(null);
    private webhookSecret: string;

    constructor() {
        super();
        this.initializeUser();
        this.initializeWebhook();
    }

    private async initializeUser() {
        try {
            const userId = await this.auth.getUID();
            if (userId) {
                this.uid.set(userId);
                const initialBalance = await firstValueFrom(this.getBalance(userId));
                if (initialBalance !== undefined) {
                    this.balance.set(initialBalance);
                }
            }
        } catch (error) {
            console.error('Error initializing user:', error);
        }
    }

    private async initializeWebhook() {
        this.webhookSecret = environment['WEBHOOK_SECRET'] || '';
        const userId = await this.auth.getUID();
        if (!userId) return;

        const headers = new HttpHeaders()
            .set('X-Webhook-Secret', this.webhookSecret)
            .set('Content-Type', 'application/json');

        this.http.post<BalanceWebhookResponse>(
            `${this.webhookUrl}/balance`,
            {
                userId: userId,
                timestamp: new Date().toISOString()
            },
            { headers }
        ).pipe(
            takeUntil(this.destroySubject)
        ).subscribe({
            next: (response) => {
                this.balance.set(response.balance);
            },
            error: (error) => console.error('Balance webhook error:', error)
        });
    }

    getSportsByNFL(sportType: SportType): Observable<Game[]> {
        const userId = this.uid();
        if (!userId) return of([]);

        return this.http.get<Game[]>(`${this.apiUrl}/${userId}/${sportType}/getUpcomingGames`)
            .pipe(
                retry(3),
                catchError(this.handleError<Game[]>('getSportsByNFL', []))
            );
    }

    getBalance(uid: string): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/${uid}/getUserBalance`)
            .pipe(
                retry(3),
                catchError(this.handleError<number>('getBalance', 0))
            );
    }

    addHistory(betHistory: BetHistory): Observable<number> {
        return this.http.post<number>(`${this.apiUrl}/saveBetHistory`, betHistory)
            .pipe(
                retry(1),
                catchError(error => {
                    console.error('Error:', error);
                    return throwError(() => error);
                })
            );
    }

    getRecentBetsByUid(): Observable<BetHistory[]> {
        const userId = this.uid();
        if (!userId) return of([]);

        return this.http.get<BetHistory[]>(`${this.apiUrl}/${userId}/getRecentBets`)
            .pipe(
                retry(3),
                catchError(this.handleError<BetHistory[]>('getRecentBetsByUid', []))
            );
    }

    getCurrentBalance(): Signal<number> {
        return this.balance.asReadonly();
    }

    getCurrentUserId(): string | null {
        return this.uid();
    }

    ngOnDestroy() {
        this.destroySubject.next();
        this.destroySubject.complete();
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: HttpErrorResponse): Observable<T> => {
            console.error(`${operation} failed:`, error);

            if (error.status === 0) {
                console.error('Network or client-side error:', error.error);
            } else {
                console.error(
                    `Backend returned code ${error.status}, body was:`,
                    error.error
                );
            }

            if (result === undefined) {
                throw error;
            }

            return of(result as T);
        };
    }
}

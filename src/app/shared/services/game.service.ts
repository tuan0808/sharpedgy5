import {inject, Injectable} from '@angular/core';
import {Game} from "../model/paper-betting/Game";
import {Observable, of, retry, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {BaseApiService} from "./base-api.service";
import {SportType} from "../model/SportType";
import {BetHistory} from "../model/paper-betting/BetHistory";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";


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
export class GameService extends BaseApiService<Game> {
    protected override apiUrl = 'http://localhost:8080/paper-betting/v1';

    getSportsByNFL(uid: string, sportType: SportType): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.apiUrl}/${uid}/${sportType}/getUpcomingGames`)
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

    addHistory(betHistory: BetHistory): Observable<BetHistory> {
        console.log('Sending bet history:', JSON.stringify(betHistory));
        return this.http.post<BetHistory>(`${this.apiUrl}/saveBetHistory`, betHistory)
            .pipe(
                retry(1),
                catchError((error: any): Observable<BetHistory> => {
                    console.error('Error in addHistory:', error);
                    return throwError(() => error);
                })
            );
    }

    getRecentBetsByUid(uid: string): Observable<BetHistory[]> {
        return this.http.get<BetHistory[]>(`${this.apiUrl}/${uid}/getRecentBets`)
            .pipe(
                retry(3),
                catchError(this.handleError<BetHistory[]>('getRecentBetsByUid', []))
            );
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

            // If result is undefined, throw the error instead of returning a default value
            if (result === undefined) {
                throw error;
            }

            return of(result as T);
        };
    }
}

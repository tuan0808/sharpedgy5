import {computed, Injectable, signal, Signal, WritableSignal} from '@angular/core';
import dummyData from "../../../assets/dummy.json"
import {Game} from "../model/paper-betting/Game";
import {NFLGame} from "../model/paper-betting/ b23/NFLGame";
import {BehaviorSubject, Observable, of, startWith} from "rxjs";
import {catchError, map, switchMap} from "rxjs/operators";
import {toSignal} from "@angular/core/rxjs-interop";
import {HttpClient} from "@angular/common/http";
import {BaseApiService} from "./base-api.service";
import {SportType} from "../model/SportType";
import {BetFormData} from "../model/paper-betting/BetFormData";
import {Bet} from "../model/paper-betting/Bet";
import {BetHistory} from "../model/paper-betting/BetHistory";


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

  getSportsByNFL(sportType : SportType): Observable<Game[]> {
      console.log(`${this.apiUrl}/${sportType}/getUpcomingGames`)
    return this.http.get<Game[]>(`${this.apiUrl}/${sportType}/getUpcomingGames`)
        .pipe(
            map(games =>
                //games.map(m=>m.  )
                games),
            catchError(error => {
              console.error('Error fetching NFL games:', error);
              return [];
            })
        );
  }

    getBalance(uid: string): Observable<number> {
        console.log('Fetching balance for uid:', uid);
        let z =  this.http.get<number>(`${this.apiUrl}/${uid}/getUserBalance`)
            .pipe(
                // Remove unnecessary map since we're already getting a number
                catchError(error => {
                    console.error('Error fetching balance:', error);
                    return of(0); // Return 0 as default value on error
                })
            );
        z.subscribe(s=>console.log(s))
        return z;
    }

     addHistory(betFormData : BetHistory) {
        let z =  this.http.post<BetFormData>(`${this.apiUrl}/saveBetHistory`, betFormData)
            .pipe(
                // Remove unnecessary map since we're already getting a number
                catchError(error => {
                    console.error('Error fetching balance:', error);
                    return of(0); // Return 0 as default value on error
                })
            );
        z.subscribe(s=>console.log(s))
    }
}

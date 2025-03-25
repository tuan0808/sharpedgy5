// import { Injectable } from '@angular/core';
// import {BetSettlement} from "../model/paper-betting/BetSettlement";
// import {Observable, of} from "rxjs";
// import {Game} from "../model/paper-betting/Game";
// import {HttpClient} from "@angular/common/http";
//
// @Injectable({
//   providedIn: 'root'
// })
// export class PredictionsService {
//   // Typically you would replace this with an actual API endpoint
//   private apiUrl = '/api/games';
//
//   constructor(private http: HttpClient) { }
//
//   getGames(): Observable<Game[]> {
//     // In a real application, you would fetch from the API
//     // return this.http.get<Game[]>(this.apiUrl);
//
//     // For demo purposes, return mock data
//     return of([
//       {
//         id: '1',
//         status: 'No active bets placed',
//         scheduled: '2025-04-22T18:00:00Z',
//         venue: 'NRG Stadium, Houston, Texas',
//         homeTeam: {
//           id: 'hou',
//           name: 'Houston Texans',
//           logo: '🏈'
//         },
//         awayTeam: {
//           id: 'ari',
//           name: 'Arizona Cardinals',
//           logo: '🏈'
//         },
//         favorite: 'home',
//         spread: 3.54,
//         moneylineHome: 215,
//         moneylineAway: -111,
//         overUnderTotal: 47.5,
//         betSettlement: {
//           betType: 0,
//           wagerValue: 0,
//           wagerAmount: 0,
//           comment: ''
//         }
//       },
//       {
//         id: '2',
//         status: 'No active bets placed',
//         scheduled: '2025-04-20T19:30:00Z',
//         venue: 'Lucas Oil Stadium, Indianapolis, Indiana',
//         homeTeam: {
//           id: 'ind',
//           name: 'Indianapolis Colts',
//           logo: '🏈'
//         },
//         awayTeam: {
//           id: 'ten',
//           name: 'Tennessee Titans',
//           logo: '🏈'
//         },
//         favorite: 'home',
//         spread: 6.74,
//         moneylineHome: 227,
//         moneylineAway: -210,
//         overUnderTotal: 45.0,
//         betSettlement: {
//           betType: 0,
//           wagerValue: 0,
//           wagerAmount: 0,
//           comment: ''
//         }
//       }
//     ]);
//   }
//
//   placeBet(gameId: string, betSettlement: BetSettlement): Observable<Game> {
//     // In a real application, you would post to the API
//     // return this.http.post<Game>(`${this.apiUrl}/${gameId}/bet`, betSettlement);
//
//     // For demo purposes, just return success
//     return of({} as Game);
//   }
// }

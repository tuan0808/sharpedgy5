import {inject, Injectable} from '@angular/core';
import {BetSettlement} from "../model/paper-betting/BetSettlement";
import {Observable, of, retry, throwError, timeout} from "rxjs";
import {Game} from "../model/paper-betting/Game";
import {HttpClient} from "@angular/common/http";
import {Prediction} from "../model/Prediction";
import {Account} from "../model/paper-betting/Account";
import {environment} from "../../../environments/environment";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {catchError, map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class PredictionsService {
    http = inject(HttpClient)

    constructor() {
    }

    async postPrediction(prediction : Prediction) : Promise<Observable<unknown>> {
        return this.http.post<number>(`${environment.apiUrl}/postPrediction`, prediction).pipe(
            catchError(error => {
                return throwError(() => error);
            })
        );
    }
}

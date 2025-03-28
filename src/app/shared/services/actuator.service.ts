import {computed, inject, Injectable, Signal, signal} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {interval, of} from "rxjs";
import {catchError, map, switchMap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ActuatorService {
  private http = inject(HttpClient)
  private status = signal<'UP' | 'DOWN'>('UP');
  private url = 'http://localhost:8080/actuator/health';

  constructor() {
    this.initialCheck();
    this.checkHealthPeriodically();
  }

  private initialCheck() {
    this.http.get(this.url).pipe(
        map(response => response['status']),
        catchError(() => of('DOWN'))
    ).subscribe(status => this.status.set(status));
  }

  private checkHealthPeriodically() {
    interval(30000).pipe( // Check every 30 seconds
        switchMap(() => this.http.get(this.url)),
        map(response => response['status']),
        catchError(() => of('DOWN'))
    ).subscribe(status => this.status.set(status));
  }

  get statusSignal(): Signal<'UP' | 'DOWN'> {
    return this.status;
  }
}

import { Injectable, Signal, signal } from '@angular/core';
import { Observable, interval, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class ActuatorService extends BaseService<any> {
  protected override apiUrl = 'http://localhost:8080/actuator';
  private status = signal<'UP' | 'DOWN'>('UP');

  constructor() {
    super();
    this.initialCheck();
    this.checkHealthPeriodically();
  }

  private initialCheck() {
    this.getHealth().subscribe(status => this.status.set(status));
  }

  private checkHealthPeriodically() {
    interval(30000).pipe( // Check every 30 seconds
        switchMap(() => this.getHealth())
    ).subscribe(status => this.status.set(status));
  }

  private getHealth(): Observable<'UP' | 'DOWN'> {
    return this.get<any>(
        `${this.apiUrl}/health`,
        'Failed to check health',
        { withCredentials: false } // Actuator typically doesn't need credentials
    ).pipe(
        map(response => response?.status || 'DOWN'),
        catchError(() => of('DOWN'))
    );
  }

  get statusSignal(): Signal<'UP' | 'DOWN'> {
    return this.status;
  }
}

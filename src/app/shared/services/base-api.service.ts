import {computed, inject, Injectable} from '@angular/core';
import {catchError, map, switchMap} from "rxjs/operators";
import {toSignal} from "@angular/core/rxjs-interop";
import {BehaviorSubject, startWith} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {RequestState} from "../model/RequestState";

@Injectable({
  providedIn: 'root'
})
export abstract class BaseApiService<T> {
  protected http = inject(HttpClient);
  protected abstract apiUrl: string;

  // Refresh trigger
  private refreshData$ = new BehaviorSubject<void>(undefined);

  // Main data stream with loading and error states
  private dataState$ = this.refreshData$.pipe(
      switchMap(() => this.http.get<T[]>(this.apiUrl).pipe(
          map((data) => ({
            loading: false,
            data,
            error: null
          })),
          catchError((error) => [{
            loading: false,
            data: null,
            error: error.message
          }]),
          startWith({
            loading: true,
            data: null,
            error: null
          })
      ))
  );

  // Convert to signals
  protected readonly state = toSignal(this.dataState$);

  // Public computed signals
  readonly items = computed(() => this.state().data);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  // CRUD operations
  refresh(): void {
    this.refreshData$.next();
  }

  getById(id: number) {
    return this.http.get<T>(`${this.apiUrl}/${id}`);
  }

  create(item: Omit<T, 'id'>) {
    return this.http.post<T>(this.apiUrl, item).pipe(
        map(newItem => {
          this.refresh();
          return newItem;
        })
    );
  }

  update(id: number, item: Partial<T>) {
    return this.http.patch<T>(`${this.apiUrl}/${id}`, item).pipe(
        map(updatedItem => {
          this.refresh();
          return updatedItem;
        })
    );
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        map(() => {
          this.refresh();
        })
    );
  }
}

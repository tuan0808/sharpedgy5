import {DestroyRef, inject, Injectable, Signal, signal} from '@angular/core';
import {UserData} from "../model/UserData";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Observable, of, retry} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {catchError} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  protected user : Signal<UserData> = signal(null)
  private apiUrl = "https://localhost:8080"
  private readonly destroyRef = inject(DestroyRef);

  constructor(private http : HttpClient) { }

  getUser(uid: string): Observable<UserData | null> {
    return this.http.get<UserData>(`${this.apiUrl}/${uid}/getUser`).pipe(
        retry(3),
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          if (error instanceof HttpErrorResponse) {
            console.error('getAccount failed:', error);
            if (error.status === 0) {
              console.error('Network or client-side error:', error.error);
            } else {
              console.error(
                  `Backend returned code ${error.status}, body was:`,
                  error.error
              );
            }
          }
          return of(null);
        })
    );
  }
}

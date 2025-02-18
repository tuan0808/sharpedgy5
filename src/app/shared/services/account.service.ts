import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Observable} from "rxjs";
import {Account} from "../model/paper-betting/Account";

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  accounts$ = this.accountsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAccounts();
  }

  private loadAccounts(): void {
    this.http.get<Account[]>('/api/accounts').subscribe(
        accounts => this.accountsSubject.next(accounts)
    );
  }

  filterAccounts(status: string, searchTerm: string): Account[] {
    const accounts = this.accountsSubject.value;
    return accounts.filter(account => {
      const statusMatch = status === 'all' ||
          (status === 'active' && account.activeAccount) ||
          (status === 'closed' && !account.activeAccount);

      const searchMatch = !searchTerm ||
          account.id.toString().includes(searchTerm.toLowerCase()) ||
          account.betHistory.some(bet =>
              bet.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
              bet.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
              bet.sport.toLowerCase().includes(searchTerm.toLowerCase())
          );

      return statusMatch && searchMatch;
    });
  }
}

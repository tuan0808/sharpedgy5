// import { Component } from '@angular/core';
// import {BehaviorSubject, combineLatest} from "rxjs";
// import {map} from "rxjs/operators";
// import {Account} from "../../../shared/model/paper-betting/Account";
//
// @Component({
//   selector: 'app-educational-content',
//   standalone: true,
//   imports: [],
//   templateUrl: './educational-content.component.html',
//   styleUrl: './educational-content.component.scss'
// })
// export class EducationalContentComponent {
//   readonly initialBalance = 1000;
//   readonly itemsPerPage = 5;
//
//   private accountsSubject = new BehaviorSubject<Account[]>([
//     // Your initial accounts data here
//   ]);
//
//   searchTerm = '';
//   filterStatus = 'all';
//   sortOption = 'newest';
//   currentPage = 1;
//   expandedAccounts = new Set<number>();
//   Math = Math; // Make Math available in template
//
//   accounts$ = this.accountsSubject.asObservable();
//
//   filteredAccounts$ = combineLatest([
//     this.accounts$,
//     new BehaviorSubject(this.searchTerm),
//     new BehaviorSubject(this.filterStatus),
//     new BehaviorSubject(this.sortOption)
//   ]).pipe(
//       map(([accounts, search, filter, sort]) => {
//         let filtered = accounts;
//
//         if (search) {
//           filtered = filtered.filter(account =>
//               account.id.toString().includes(search) ||
//               account.betHistory.some(bet =>
//                   bet.homeTeam.toLowerCase().includes(search.toLowerCase()) ||
//                   bet.awayTeam.toLowerCase().includes(search.toLowerCase())
//               )
//           );
//         }
//
//         if (filter !== 'all') {
//           filtered = filtered.filter(account =>
//               filter === 'active' ? account.activeAccount : !account.activeAccount
//           );
//         }
//
//         return filtered.sort((a, b) => {
//           switch (sort) {
//             case 'newest':
//               return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
//             case 'oldest':
//               return new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime();
//             case 'highest':
//               return b.balance - a.balance;
//             case 'lowest':
//               return a.balance - b.balance;
//             default:
//               return 0;
//           }
//         });
//       })
//   );
//
//   paginatedAccounts$ = this.filteredAccounts$.pipe(
//       map(accounts => accounts.slice(
//           (this.currentPage - 1) * this.itemsPerPage,
//           this.currentPage * this.itemsPerPage
//       ))
//   );
//
//   get totalPages(): number {
//     const total = this.accountsSubject.value.length;
//     return Math.ceil(total / this.itemsPerPage);
//   }
//
//   get pages(): number[] {
//     return Array.from({ length: this.totalPages }, (_, i) => i + 1);
//   }
//
//   ngOnInit() {
//     // Initialize with mock data
//     this.accountsSubject.next([
//       // Your mock accounts data here
//     ]);
//   }
//
//   toggleAccount(accountId: number): void {
//     this.expandedAccounts = new Set(this.expandedAccounts);
//     if (this.expandedAccounts.has(accountId)) {
//       this.expandedAccounts.delete(accountId);
//     } else {
//       this.expandedAccounts.add(accountId);
//     }
//   }
//
//   setPage(page: number): void {
//     if (page >= 1 && page <= this.totalPages) {
//       this.currentPage = page;
//     }
//   }
//
//   onSearchChange(value: string): void {
//     this.searchTerm = value;
//     this.currentPage = 1;
//   }
//
//   onFilterChange(value: string): void {
//     this.filterStatus = value;
//     this.currentPage = 1;
//   }
//
//   onSortChange(value: string): void {
//     this.sortOption = value;
//     this.currentPage = 1;
//   }
// }

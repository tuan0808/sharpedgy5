// leaderboard.component.ts
import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaderboardService } from '../../../shared/services/leaderboard.service';
import { LeaderRow } from '../../../shared/model/paper-betting/rankings/LeaderRow';
import { AuthService } from '../../../shared/services/auth.service';
import { LeaderboardResponse } from '../../../shared/model/paper-betting/rankings/LeaderboardResponse';

@Component({
    selector: 'app-betting-rankings',
    imports: [CommonModule, FormsModule],
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
    private authService = inject(AuthService);
    private leaderboardService = inject(LeaderboardService);

    currentUser: LeaderRow | null = null;
    users: LeaderRow[] = [];
    error: string | null = null;
    page: number = 0;
    pageSize: number = 10;
    totalPages: number = 1;
    totalElements: number = 0;
    hasNextPage: boolean = true;
    expandedUser: number | null = null;
    expandedCurrentUser: boolean = false;
    activePeriod: string = 'Overall';
    filterPeriods: string[] = ['Overall', 'Year', 'Month', 'Week'];
    selectedRows: Set<number> = new Set();
    pageSizeOptions: number[] = [5, 10, 25, 50];

    // Search and filter state
    searchTerm: string = '';
    sortColumn: string = 'rank';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Mobile support
    screenWidth: number = window.innerWidth;
    showMenu: boolean = false;

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.screenWidth = window.innerWidth;
    }

    ngOnInit(): void {
        this.loadLeaderboard();
    }

    loadLeaderboard(): void {
        this.authService.getUID().then(uuid => {
            this.leaderboardService.getRankingsByPage(uuid, this.page)
                .subscribe({
                    next: (response: LeaderboardResponse) => {
                        const defaultResponse = {
                            content: [],
                            pageable: { pageNumber: 0, pageSize: this.pageSize },
                            totalPages: 1,
                            totalElements: 0,
                            last: true,
                            size: this.pageSize,
                            number: 0,
                            numberOfElements: 0,
                            first: true,
                            empty: true
                        };
                        this.users = response.content || defaultResponse.content;
                        this.page = response.pageable.pageNumber || defaultResponse.pageable.pageNumber;
                        this.pageSize = response.pageable.pageSize || defaultResponse.pageable.pageSize;
                        this.totalPages = response.totalPages || defaultResponse.totalPages;
                        this.totalElements = response.totalElements || defaultResponse.totalElements;
                        this.hasNextPage = !response.last ?? defaultResponse.last;
                        this.currentUser = this.users.find(user => user.id.toString() === uuid) || null;
                    },
                    error: (err) => {
                        this.error = 'Failed to load leaderboard: ' + err.message;
                    }
                });
        }).catch(err => {
            this.error = 'Failed to get user ID: ' + err.message;
        });
    }

    // Pagination methods
    nextPage(): void {
        if (this.page < this.totalPages - 1) {
            this.page++;
            this.loadLeaderboard();
        }
    }

    prevPage(): void {
        if (this.page > 0) {
            this.page--;
            this.loadLeaderboard();
        }
    }

    setPageSize(size: number): void {
        this.pageSize = size;
        this.page = 0;
        this.loadLeaderboard();
    }

    getPageNumbers(): number[] {
        const pages = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }

    // Accordion methods
    toggleAccordion(userId: number): void {
        this.expandedUser = this.expandedUser === userId ? null : userId;
        if (this.selectedRows.has(userId)) {
            this.selectedRows.delete(userId);
        } else {
            this.selectedRows.add(userId);
        }
    }

    toggleCurrentUserAccordion(): void {
        this.expandedCurrentUser = !this.expandedCurrentUser;
    }

    // Filter methods
    setActivePeriod(period: string): void {
        this.activePeriod = period;
        this.page = 0;
        this.loadLeaderboard();
    }

    // Search and sort methods
    onSearch(term: string): void {
        this.searchTerm = term;
        this.page = 0;
        this.loadLeaderboard();
    }

    sortBy(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.page = 0;
        this.loadLeaderboard();
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) {
            return 'M6 8l4 4 4-4'; // Default sort icon
        }
        return this.sortDirection === 'asc'
            ? 'M5 15l7-7 7 7'  // Up arrow
            : 'M19 9l-7 7-7-7'; // Down arrow
    }

    // Utility methods
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // Filter users based on search term
    get filteredUsers(): LeaderRow[] {
        if (!this.searchTerm) {
            return this.users;
        }
        return this.users.filter(user =>
            user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.statistics.favoriteCategory.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    // Check if a row is selected for accordion
    isRowSelected(userId: number): boolean {
        return this.selectedRows.has(userId);
    }

    // Pagination info
    get paginationStart(): number {
        return (this.page * this.pageSize) + 1;
    }

    get paginationEnd(): number {
        return Math.min((this.page + 1) * this.pageSize, this.totalElements);
    }

    // Mobile menu toggle
    toggleMenu(): void {
        this.showMenu = !this.showMenu;
    }
}

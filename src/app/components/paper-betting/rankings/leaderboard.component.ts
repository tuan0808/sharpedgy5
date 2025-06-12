import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../../../shared/services/leaderboard.service';
import { LeaderRow } from '../../../shared/model/paper-betting/rankings/LeaderRow';

@Component({
    selector: 'app-betting-rankings',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
    private leaderboardService = inject(LeaderboardService);
    currentUser: LeaderRow | null = null;
    users: LeaderRow[] = [];
    error: string | null = null;
    page: number = 1;
    pageSize: number = 10;
    hasNextPage: boolean = true;
    expandedUser: number | null = null;
    expandedCurrentUser: boolean = false;
    activePeriod: string = 'Overall';
    filterPeriods: string[] = ['Overall', 'Year', 'Month', 'Week'];
    selectedRows: Set<number> = new Set(); // Track selected row IDs

    ngOnInit(): void {
        this.loadLeaderboard();
    }

    loadLeaderboard(): void {
    //     this.leaderboardService.getLeaderboard(this.page, this.pageSize).subscribe({
    //         next: (data: LeaderRow[]) => {
    //             this.users = data;
    //             this.currentUser = data.find(user => user.id.toString() === 'current') || data[0] || null;
    //             this.hasNextPage = data.length === this.pageSize;
    //             this.error = null;
    //             // Clear selected rows when loading new data
    //             this.selectedRows.clear();
    //         },
    //         error: (err) => {
    //             this.users = [];
    //             this.currentUser = null;
    //             this.error = `Error loading leaderboard: ${err.message || 'Unknown error'}`;
    //         }
    //     });
     }

    nextPage(): void {
        if (this.hasNextPage) {
            this.page++;
            this.loadLeaderboard();
        }
    }

    prevPage(): void {
        if (this.page > 1) {
            this.page--;
            this.loadLeaderboard();
        }
    }

    toggleAccordion(userId: number): void {
        this.expandedUser = this.expandedUser === userId ? null : userId;
        // Toggle selection state
        if (this.selectedRows.has(userId)) {
            this.selectedRows.delete(userId);
        } else {
            this.selectedRows.add(userId);
        }
    }

    toggleCurrentUserAccordion(): void {
        this.expandedCurrentUser = !this.expandedCurrentUser;
    }

    setActivePeriod(period: string): void {
        this.activePeriod = period;
    }

    getWinRateClass(winRate: number): string {
        if (winRate > 55) return 'text-green-600';
        if (winRate < 50) return 'text-red-600';
        return 'text-yellow-600';
    }

    getResultClass(result: string): string {
        return result === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }

    getRankClass(index: number): string {
        switch (index) {
            case 0: return 'text-yellow-500';
            case 1: return 'text-gray-400';
            case 2: return 'text-amber-600';
            default: return 'bg-blue-100 text-blue-800';
        }
    }

    getCurrentUserIndex(): number {
        return this.currentUser ? this.users.findIndex(u => u.id === this.currentUser.id) : -1;
    }

    isRowSelected(userId: number): boolean {
        return this.selectedRows.has(userId);
    }
}

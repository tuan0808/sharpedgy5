// src/app/betting-rankings/leaderboard.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LeaderRow} from "../../../shared/model/paper-betting/rankings/LeaderRow";
import {LeaderboardService} from "../../../shared/services/leaderboard.service";

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

    async ngOnInit(): Promise<void> {
        console.log('LeaderboardComponent: Waiting for initialization');
        let attempts = 0;
        const maxAttempts = 30;
        while (!this.leaderboardService.initialized() && attempts < maxAttempts) {
            console.log(`BettingRankingsComponent: Waiting, attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!this.leaderboardService.initialized()) {
            console.error('LeaderboardComponent: Initialization timed out');
            this.error = this.leaderboardService.errorSignal() || 'Service initialization failed';
            return;
        }
        console.log('LeaderboardComponent: Service initialized, loading leaderboard');
        this.loadLeaderboard();
    }

    loadLeaderboard(): void {
        console.log('LeaderboardComponent: Subscribing to getLeaderboard');
        try {
            this.leaderboardService.getLeaderboard(1, 10).subscribe({
                next: (data) => {
                    console.log('LeaderboardComponent: Leaderboard data received:', data);
                    if (data) {
                        this.currentUser = data.currentUser;
                        this.users = data.rankings;
                        this.error = null;
                    } else {
                        this.currentUser = null;
                        this.users = [];
                        this.error = this.leaderboardService.errorSignal() || 'Failed to load leaderboard';
                        console.warn('LeaderboardComponent: Leaderboard data is null, error:', this.error);
                    }
                },
                error: (err) => {
                    this.currentUser = null;
                    this.users = [];
                    this.error = `Error loading leaderboard: ${err.message || 'Unknown error'}`;
                    console.error('LeaderboardComponent: Subscription error:', err);
                },
                complete: () => console.log('LeaderboardComponent: Subscription completed')
            });
        } catch (error) {
            console.error('LeaderboardComponent: Error in loadLeaderboard:', error);
            this.error = 'Failed to load leaderboard';
        }
    }

    retryLoad(): void {
        this.error = null;
        this.loadLeaderboard();
    }

    expandedUser: number | null = null;
    expandedCurrentUser: boolean = false;
    activePeriod: string = 'Overall';
    filterPeriods: string[] = ['Overall', 'Year', 'Month', 'Week'];

    toggleAccordion(userId: number): void {
        this.expandedUser = this.expandedUser === userId ? null : userId;
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
            case 0:
                return 'text-yellow-500';
            case 1:
                return 'text-gray-400';
            case 2:
                return 'text-amber-600';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    }

    getCurrentUserIndex(): number {
        return this.currentUser ? this.users.findIndex(u => u.id === this.currentUser.id) : -1;
    }
}

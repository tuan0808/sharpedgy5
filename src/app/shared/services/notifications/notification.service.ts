import { Injectable } from '@angular/core';
import {SportNotification} from "../../model/notifications/SportNotification";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: SportNotification[] = [
    {
      id: 1,
      type: 'Point Spread Diff',
      gameId: 'lal-gsw-20241125',
      homeTeam: 'Lakers',
      awayTeam: 'Warriors',
      gameDate: '2024-11-25',
      gameTime: '7:30 PM PST',
      sport: 'Basketball',
      league: 'NBA',
      enabled: true,
      conditions: { threshold: 1.5, direction: 'any' },
      lastTriggered: '2 min ago',
      triggerCount: 3,
      season: '2024-25 Regular Season',
      priority: 5,
      savings: 15
    },
    {
      id: 2,
      type: 'Betting Volume Spike',
      gameId: 'kc-buf-20241127',
      homeTeam: 'Bills',
      awayTeam: 'Chiefs',
      gameDate: '2024-11-27',
      gameTime: '4:25 PM EST',
      sport: 'Football',
      league: 'NFL',
      enabled: true,
      conditions: { threshold: 250, market: 'over/under' },
      lastTriggered: '5 min ago',
      triggerCount: 1,
      season: '2024 Regular Season',
      priority: 4,
      savings: 25
    },
    {
      id: 3,
      type: 'Score Update',
      gameId: 'bos-mia-20241125',
      homeTeam: 'Heat',
      awayTeam: 'Celtics',
      gameDate: '2024-11-25',
      gameTime: '8:00 PM EST',
      sport: 'Basketball',
      league: 'NBA',
      enabled: false,
      conditions: { quarter: 'Q4', timeRemaining: '5:00' },
      lastTriggered: '1 hour ago',
      triggerCount: 0,
      season: '2024-25 Regular Season',
      priority: 3,
      savings: 30
    },
    {
      id: 4,
      type: 'Moneyline Odds',
      gameId: 'dal-nyg-20241128',
      homeTeam: 'Giants',
      awayTeam: 'Cowboys',
      gameDate: '2024-11-28',
      gameTime: '4:30 PM EST',
      sport: 'Football',
      league: 'NFL',
      enabled: true,
      conditions: { threshold: 25, direction: 'favoring_underdog' },
      lastTriggered: 'Never',
      triggerCount: 0,
      season: '2024 Regular Season',
      priority: 4,
      savings: 10
    }
  ];

  getNotifications(): SportNotification[] {
    return [...this.notifications];
  }

  addNotification(notification: SportNotification): void {
    this.notifications.push(notification);
  }

  updateNotification(id: number, updates: Partial<SportNotification>): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications[index] = { ...this.notifications[index], ...updates };
    }
  }

  deleteNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  toggleNotification(id: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.enabled = !notification.enabled;
    }
  }
}

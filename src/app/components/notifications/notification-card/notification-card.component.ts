import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SportNotification} from "../../../shared/model/notifications/SportNotification";
import {DatePipe} from "@angular/common";

@Component({
    selector: 'app-notification-card',
    imports: [
        DatePipe
    ],
    templateUrl: './notification-card.component.html',
    styleUrl: './notification-card.component.scss'
})
export class NotificationCardComponent {
  @Input() notification!: SportNotification;
  @Input() darkMode = false;
  @Output() toggleNotification = new EventEmitter<number>();
  @Output() deleteNotification = new EventEmitter<number>();

  // Main card styling
  getCardClass(): string {
    return `notification-card ${this.darkMode ? 'dark' : 'light'}`;
  }

  // Type badge styling with different colors for each notification type
  getTypeClass(): string {
    const baseClass = 'type-badge';
    switch (this.notification.type) {
      case 'Point Spread Diff':
        return `${baseClass} point-spread`;
      case 'Betting Volume Spike':
        return `${baseClass} betting-volume`;
      case 'Score Update':
        return `${baseClass} score-update`;
      case 'Moneyline Odds':
        return `${baseClass} moneyline`;
      case 'Over/Under':
        return `${baseClass} over-under`;
      default:
        return `${baseClass} default`;
    }
  }

  // League badge styling
  getLeagueBadgeClass(): string {
    return `league-badge ${this.darkMode ? 'dark' : 'light'}`;
  }

  // EventStatus dot (enabled/disabled indicator)
  getStatusDotClass(): string {
    return `status-dot ${this.notification.enabled ? 'enabled' : 'disabled'}`;
  }

  // Game title (team matchup) styling
  getGameTitleClass(): string {
    return `game-title ${this.darkMode ? 'dark' : 'light'}`;
  }

  // Game details (date and time) styling
  getGameDetailsClass(): string {
    return `game-details ${this.darkMode ? 'dark' : 'light'}`;
  }

  // Statistics items (last triggered, trigger count) styling
  getStatItemClass(): string {
    return `stat-item ${this.darkMode ? 'dark' : 'light'}`;
  }

  // Card actions container styling
  getCardActionsClass(): string {
    return `card-actions ${this.darkMode ? 'dark' : 'light'}`;
  }

  // Toggle button (enable/disable notification) styling
  getToggleButtonClass(): string {
    const baseClass = 'action-button';
    return this.notification.enabled
        ? `${baseClass} toggle-enabled`
        : `${baseClass} toggle-disabled`;
  }

  // Edit button styling
  getEditButtonClass(): string {
    return `action-button edit ${this.darkMode ? 'dark' : 'light'}`;
  }

  // Delete button styling
  getDeleteButtonClass(): string {
    return `action-button delete ${this.darkMode ? 'dark' : 'light'}`;
  }

  // Utility method to format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  // Event handlers
  onToggle(): void {
    this.toggleNotification.emit(this.notification.id);
  }

  onEdit(): void {
    // Edit functionality can be implemented later
    console.log('Edit notification:', this.notification.id);
  }

  onDelete(): void {
    this.deleteNotification.emit(this.notification.id);
  }
}

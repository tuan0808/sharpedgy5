import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NotificationFormData} from "../../../shared/model/notifications/NotificationFormData";
import {NotificationSettings} from "../../../shared/model/notifications/NotificationSettings";
import {Game} from "../../../shared/model/notifications/Game";

@Component({
  selector: 'app-notification-form',
  standalone: true,
  imports: [],
  templateUrl: './notification-form.component.html',
  styleUrl: './notification-form.component.scss'
})
export class NotificationFormComponent {
  @Input() upcomingGames: Game[] = [];
  @Input() activeGames: Game[] = [];
  @Input() notificationTypes: string[] = [];
  @Input() darkMode = false;
  @Output() formSubmit = new EventEmitter<NotificationFormData>();
  @Output() formCancel = new EventEmitter<void>();

  wizardStep = 1;
  selectedGames: Game[] = [];
  selectedNotificationType = 'Point Spread Diff';
  activeTab: 'upcoming' | 'live' = 'upcoming';
  threshold: number | undefined;

  notificationSettings: NotificationSettings = {
    sensitivity: 'medium',
    gameHoursOnly: false,
    enableImmediately: true,
    autoDisable: false
  };

  ngOnInit(): void {
    // Initialize with default values
  }

  // Game selection methods
  getCurrentGames(): Game[] {
    return this.activeTab === 'upcoming' ? this.upcomingGames : this.activeGames;
  }

  handleGameSelection(game: Game): void {
    const isSelected = this.selectedGames.some(g => g.id === game.id);
    if (isSelected) {
      this.selectedGames = this.selectedGames.filter(g => g.id !== game.id);
    } else {
      this.selectedGames = [...this.selectedGames, game];
    }
  }

  isGameSelected(game: Game): boolean {
    return this.selectedGames.some(g => g.id === game.id);
  }

  removeSelectedGame(game: Game): void {
    this.selectedGames = this.selectedGames.filter(g => g.id !== game.id);
  }

  // Wizard navigation methods
  handleWizardNext(): void {
    if (this.wizardStep === 1 && this.selectedGames.length === 0) {
      // Could emit an error event or show validation message
      return;
    }
    this.wizardStep++;
  }

  handleWizardBack(): void {
    this.wizardStep--;
  }

  // Form submission methods
  handleCreateNotifications(): void {
    const formData: NotificationFormData = {
      selectedGames: this.selectedGames,
      notificationType: this.selectedNotificationType,
      settings: this.notificationSettings,
      threshold: this.threshold
    };

    this.formSubmit.emit(formData);
    this.resetForm();
  }

  handleCancel(): void {
    this.resetForm();
    this.formCancel.emit();
  }

  private resetForm(): void {
    this.wizardStep = 1;
    this.selectedGames = [];
    this.selectedNotificationType = 'Point Spread Diff';
    this.activeTab = 'upcoming';
    this.threshold = undefined;
    this.notificationSettings = {
      sensitivity: 'medium',
      gameHoursOnly: false,
      enableImmediately: true,
      autoDisable: false
    };
  }

  // CSS class helper methods
  getModalClass(): string {
    return `modal-container ${this.darkMode ? 'dark' : 'light'}`;
  }

  getHeaderClass(): string {
    return `modal-header ${this.darkMode ? 'dark' : 'light'}`;
  }

  getProgressClass(): string {
    return `progress-section ${this.darkMode ? 'dark' : 'light'}`;
  }

  getFooterClass(): string {
    return `modal-footer ${this.darkMode ? 'dark' : 'light'}`;
  }

  getCloseButtonClass(): string {
    return `close-button ${this.darkMode ? 'dark' : 'light'}`;
  }

  getStepTitleClass(): string {
    return `step-title ${this.darkMode ? 'dark' : 'light'}`;
  }

  getStepDescriptionClass(): string {
    return `step-description ${this.darkMode ? 'dark' : 'light'}`;
  }

  getGameTabsClass(): string {
    return `game-tabs ${this.darkMode ? 'dark' : 'light'}`;
  }

  getTabButtonClass(tab: 'upcoming' | 'live'): string {
    const baseClass = 'tab-button';
    const isActive = this.activeTab === tab;
    const activeState = isActive ? 'active' : 'inactive';
    const theme = this.darkMode ? 'dark' : 'light';
    return `${baseClass} ${activeState} ${theme}`;
  }

  getGameClass(game: Game): string {
    const baseClass = 'game-option';
    const isSelected = this.isGameSelected(game);
    const selectedState = isSelected ? 'selected' : 'unselected';
    const theme = this.darkMode ? 'dark' : 'light';
    return `${baseClass} ${selectedState} ${theme}`;
  }

  getGameMatchupClass(): string {
    return `game-matchup ${this.darkMode ? 'dark' : 'light'}`;
  }

  getGameTimeClass(): string {
    return `game-time ${this.darkMode ? 'dark' : 'light'}`;
  }

  getGameRecordsClass(): string {
    return `game-records ${this.darkMode ? 'dark' : 'light'}`;
  }

  getLeagueClass(league: string): string {
    const baseClass = 'league-badge';
    switch (league) {
      case 'NBA':
        return `${baseClass} nba`;
      case 'NFL':
        return `${baseClass} nfl`;
      case 'MLB':
        return `${baseClass} mlb`;
      case 'NHL':
        return `${baseClass} nhl`;
      default:
        return `${baseClass} nhl`;
    }
  }

  getTypeClass(type: string): string {
    const baseClass = 'type-option';
    const isSelected = this.selectedNotificationType === type;
    const selectedState = isSelected ? 'selected' : 'unselected';
    const theme = this.darkMode ? 'dark' : 'light';
    return `${baseClass} ${selectedState} ${theme}`;
  }

  getTypeNameClass(): string {
    return `type-name ${this.darkMode ? 'dark' : 'light'}`;
  }

  getTypeDescriptionClass(): string {
    return `type-description ${this.darkMode ? 'dark' : 'light'}`;
  }

  getControlLabelClass(): string {
    return `control-label ${this.darkMode ? 'dark' : 'light'}`;
  }

  getSelectClass(): string {
    return `${this.darkMode ? 'dark' : 'light'}`;
  }

  getCheckboxLabelClass(): string {
    return `checkbox-label ${this.darkMode ? 'dark' : 'light'}`;
  }

  getInputClass(): string {
    return `${this.darkMode ? 'dark' : 'light'}`;
  }

  getThresholdUnitClass(): string {
    return `threshold-unit ${this.darkMode ? 'dark' : 'light'}`;
  }

  getFooterInfoClass(): string {
    return `footer-info ${this.darkMode ? 'dark' : 'light'}`;
  }

  getBackButtonClass(): string {
    return `back-button ${this.darkMode ? 'dark' : 'light'}`;
  }

  getCancelButtonClass(): string {
    return `cancel-button ${this.darkMode ? 'dark' : 'light'}`;
  }

  getStepCircleClass(step: number): string {
    const baseClass = 'step-circle';
    const isActive = this.wizardStep >= step;
    const state = isActive ? 'active' : 'inactive';
    return `${baseClass} ${state}`;
  }

  getProgressLineClass(step: number): string {
    const baseClass = 'progress-line';
    const isCompleted = this.wizardStep >= step;
    const state = isCompleted ? 'completed' : 'incomplete';
    return `${baseClass} ${state}`;
  }

  getTypeDescription(type: string): string {
    switch (type) {
      case 'Point Spread Diff':
        return 'Alert when betting lines move significantly';
      case 'Betting Volume Spike':
        return 'Alert when unusual betting activity occurs';
      case 'Score Update':
        return 'Get real-time score notifications';
      case 'Moneyline Odds':
        return 'Alert when moneyline odds change';
      case 'Over/Under':
        return 'Alert when total points line moves';
      case 'Game Start/End':
        return 'Alert when games begin or end';
      default:
        return '';
    }
  }
}

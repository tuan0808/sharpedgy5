import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { collection, addDoc, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Subscription } from 'rxjs';
import firebase from "firebase/compat";
import messaging = firebase.messaging;

// Interfaces
export interface StatCard {
  value: number;
  label: string;
  change: string;
  trend: 'positive' | 'negative' | 'neutral';
  icon: string;
  iconType: 'primary' | 'success' | 'warning' | 'error';
}

export interface Team {
  name: string;
  abbreviation: string;
  record: string;
  score?: number;
}

export interface BettingLine {
  label: string;
  value: string;
  movement?: { direction: 'up' | 'down'; amount: string };
}

export interface Game {
  id: string;
  league: string;
  leagueIcon: string;
  status: 'live' | 'scheduled' | 'final';
  statusText: string;
  awayTeam: Team;
  homeTeam: Team;
  bettingLines: BettingLine[];
  weather?: string;
  injuries?: string;
  alerts: string[];
  activeAlerts: string[];
}

export interface LiveUpdate {
  id: string;
  time: string;
  category: string;
  text: string;
}

export interface AlertType {
  id: string;
  icon: string;
  title: string;
  description: string;
  iconPath: string;
  subcategories: string[];
}

export interface Preferences {
  browser: boolean;
  email: boolean;
  sound: boolean;
  quietHours: { start: string; end: string };
}

@Component({
  selector: 'app-alerts-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgClass, RouterModule],
  templateUrl: './alerts-home.component.html',
  styleUrls: ['./alerts-home.component.scss']
})
export class AlertsHomeComponent implements OnInit, OnDestroy {
  // Component State
  notificationCount: number = 12;
  showModal: boolean = false;
  modalTitle: string = 'Create New Alert';
  modalStep: 'game-selection' | 'alert-type' | 'subcategory' | 'preferences' = 'game-selection';
  searchQuery: string = '';
  filteredGames: Game[] = [];
  selectedGame: Game | null = null;
  selectedAlertType: AlertType | null = null;
  selectedSubcategory: string | null = null;
  preferencesForm: FormGroup;
  private subscriptions: Subscription[] = [];

  // Data Properties
  stats: StatCard[] = [
    {
      value: 12,
      label: 'Active Alerts',
      change: '+3 this week',
      trend: 'positive',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      iconType: 'primary'
    },
    {
      value: 8,
      label: 'Live Games',
      change: '+2 from yesterday',
      trend: 'positive',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      iconType: 'success'
    },
    {
      value: 24,
      label: 'Line Changes Today',
      change: '-6 from yesterday',
      trend: 'negative',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>',
      iconType: 'warning'
    },
    {
      value: 3,
      label: 'Weather Delays',
      change: '',
      trend: 'neutral',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>',
      iconType: 'error'
    }
  ];

  games: Game[] = [
    {
      id: 'lakers-warriors',
      league: 'NBA',
      leagueIcon: '🏀',
      status: 'live',
      statusText: 'Live Q3 8:42',
      awayTeam: { name: 'Lakers', abbreviation: 'LAL', record: '32-28', score: 98 },
      homeTeam: { name: 'Warriors', abbreviation: 'GSW', record: '38-22', score: 102 },
      bettingLines: [
        { label: 'Spread', value: 'GSW -4.5', movement: { direction: 'up', amount: '0.5' } },
        { label: 'Total', value: '215.5', movement: { direction: 'down', amount: '2.0' } },
        { label: 'Moneyline', value: 'GSW -180' }
      ],
      weather: 'Clear, 75°F',
      injuries: 'LeBron James (Questionable)',
      alerts: ['Score Updates', 'Line Changes', 'ScheduledGame End', 'Overtime Alert'],
      activeAlerts: ['Score Updates', 'ScheduledGame End']
    },
    {
      id: 'chiefs-bills',
      league: 'NFL',
      leagueIcon: '🏈',
      status: 'scheduled',
      statusText: 'Today 8:30 PM',
      awayTeam: { name: 'Chiefs', abbreviation: 'KC', record: '14-3' },
      homeTeam: { name: 'Bills', abbreviation: 'BUF', record: '13-4' },
      bettingLines: [
        { label: 'Spread', value: 'KC -2.5', movement: { direction: 'down', amount: '1.0' } },
        { label: 'Total', value: '48.5', movement: { direction: 'down', amount: '3.0' } }
      ],
      weather: '❄️ 28°F, Snow - High delay risk',
      injuries: 'Mahomes (Questionable)',
      alerts: ['ScheduledGame Start', 'Weather Updates', 'Lineup Changes', 'Line Threshold: ±1.5'],
      activeAlerts: ['ScheduledGame Start', 'Weather Updates', 'Line Threshold: ±1.5']
    },
    {
      id: 'heat-sixers',
      league: 'NBA',
      leagueIcon: '🏀',
      status: 'scheduled',
      statusText: 'Tomorrow 7:00 PM',
      awayTeam: { name: 'Heat', abbreviation: 'MIA', record: '29-31' },
      homeTeam: { name: '76ers', abbreviation: 'PHI', record: '31-29' },
      bettingLines: [
        { label: 'Spread', value: 'PHI -3.0' },
        { label: 'Total', value: '212.5' }
      ],
      alerts: ['ScheduledGame Start', 'Playoff Implications', 'Line Changes'],
      activeAlerts: ['ScheduledGame Start', 'Playoff Implications']
    }
  ];

  liveUpdates: LiveUpdate[] = [
    { id: '1', time: '2 min ago', category: 'Line Change', text: 'Lakers vs Warriors spread moved to GSW -4.5' },
    { id: '2', time: '5 min ago', category: 'Weather', text: 'Chiefs vs Bills: Heavy snow warning issued' },
    { id: '3', time: '8 min ago', category: 'Arbitrage', text: '5.2% arbitrage opportunity detected' },
    { id: '4', time: '12 min ago', category: 'Injury', text: 'Mahomes upgraded to PROBABLE for tonight\'s game' }
  ];

  alertTypes: AlertType[] = [
    {
      id: 'smart-line-monitoring',
      icon: '📈',
      title: 'Smart Line Monitoring',
      description: 'Track betting line changes and movements',
      iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      subcategories: ['Point Spread Changes', 'Moneyline Odds Shifts', 'Over/Under Line Movements', 'Prop Bet Line Updates', 'Betting Volume Spikes']
    },
    {
      id: 'game-events',
      icon: '🕐',
      title: 'ScheduledGame Events',
      description: 'ScheduledGame start, score updates, and milestones',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      subcategories: ['ScheduledGame Start', 'Score Updates', 'Lead Changes', 'Quarter/Half/Period End', 'Overtime Alerts', 'ScheduledGame Milestones', 'Final Score']
    },
    {
      id: 'player-performance',
      icon: '⭐',
      title: 'Player Performance',
      description: 'Player-specific alerts and updates',
      iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      subcategories: ['Points Scored', 'Assists', 'Rebounds', 'Touchdowns', 'Passing/Rushing Yards', 'Goals/Saves', 'Turnovers', 'Minutes Played', 'Stat Thresholds']
    },
    {
      id: 'market-intelligence',
      icon: '🎯',
      title: 'Market Intelligence',
      description: 'Sharp money and betting patterns',
      iconPath: 'M9 12l2 2 4-4',
      subcategories: ['Sharp Money Movements', 'Public Betting Trends', 'Line Movement Due to Big Bets', 'Market Imbalance Alerts', 'Arbitrage Opportunities']
    }
  ];

  constructor(private fb: FormBuilder) {
    this.preferencesForm = this.fb.group({
      browser: [true],
      email: [false],
      sound: [true],
      quietHours: this.fb.group({
        start: ['23:00'],
        end: ['07:00']
      })
    });
  }

  ngOnInit(): void {
    this.filteredGames = [...this.games];
    this.fetchNotificationCount();
    this.listenForUpdates();
    this.handleFcmMessages();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Header Actions
  createAlert(): void {
    this.showModal = true;
    this.modalStep = 'game-selection';
    this.modalTitle = 'Create New Alert';
  }

  closeModal(): void {
    this.showModal = false;
    this.modalStep = 'game-selection';
    this.selectedGame = null;
    this.selectedAlertType = null;
    this.selectedSubcategory = null;
    this.preferencesForm.reset({ browser: true, email: false, sound: true, quietHours: { start: '23:00', end: '07:00' } });
  }

  nextStep(step: 'alert-type' | 'subcategory' | 'preferences'): void {
    if (step === 'alert-type' && !this.selectedGame) return;
    if (step === 'subcategory' && !this.selectedAlertType) return;
    if (step === 'preferences' && !this.selectedSubcategory) return;
    this.modalStep = step;
  }

  backStep(step: 'game-selection' | 'alert-type' | 'subcategory'): void {
    this.modalStep = step;
  }

  searchGames(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredGames = this.games.filter(game =>
        game.awayTeam.name.toLowerCase().includes(query) ||
        game.homeTeam.name.toLowerCase().includes(query) ||
        game.league.toLowerCase().includes(query)
    );
  }

  selectGame(game: Game): void {
    this.selectedGame = game;
  }

  selectAlertType(alertType: AlertType): void {
    this.selectedAlertType = alertType;
    this.selectedSubcategory = null; // Reset subcategory
  }

  selectSubcategory(subcategory: string): void {
    this.selectedSubcategory = subcategory;
  }

  getSubcategories(alertTypeId: string | undefined): string[] {
    if (!alertTypeId) return [];
    const alertType = this.alertTypes.find(type => type.id === alertTypeId);
    return alertType?.subcategories || [];
  }

  toggleStatSetting(label: string): void {
    console.log(`Toggled setting for stat: ${label}`);
    // Implement stat-specific settings toggle
  }

  dismissUpdate(id: string): void {
    this.liveUpdates = this.liveUpdates.filter(update => update.id !== id);
  }

  async saveAlert(): Promise<void> {
    // const user = getAuth().currentUser;
    // if (user && this.selectedGame && this.selectedAlertType && this.selectedSubcategory) {
    //   try {
    //     // Request FCM permission and token
    //     const permission = await SportNotification.requestPermission();
    //     if (permission === 'granted') {
    //       const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
    //       await setDoc(doc(db, `users/${user.uid}/tokens`, token), {
    //         token,
    //         deviceType: 'web',
    //         createdAt: new Date().toISOString()
    //       });
    //
    //       // Save alert to Firestore
    //       await addDoc(collection(db, `users/${user.uid}/notifications`), {
    //         gameId: this.selectedGame.id,
    //         alertType: this.selectedAlertType.title,
    //         subcategory: this.selectedSubcategory,
    //         preferences: this.preferencesForm.value,
    //         created: new Date().toISOString(),
    //         status: 'Active'
    //       });
    //
    //       this.notificationCount++;
    //       alert('Alert created successfully!');
    //       this.closeModal();
    //     } else {
    //       alert('SportNotification permission denied.');
    //     }
    //   } catch (err) {
    //     console.error('Error saving alert:', err);
    //     alert('Failed to create alert.');
    //   }
    // }
  }

  private fetchNotificationCount(): void {

  }

  private listenForUpdates(): void {

  }

  private handleFcmMessages(): void {
    // onMessage(messaging, (payload) => {
    //   const update: LiveUpdate = {
    //     id: Date.now().toString(),
    //     time: new Date().toLocaleTimeString(),
    //     category: payload.data?.['category'] || 'General',
    //     text: payload.notification?.body || 'New update received'
    //   };
    //   this.liveUpdates = [update, ...this.liveUpdates.slice(0, 19)];
    // });
  }

  private updateLiveGameScores(): void {
    this.games = this.games.map(game => {
      if (game.status === 'live' && game.awayTeam.score !== undefined && game.homeTeam.score !== undefined) {
        return {
          ...game,
          awayTeam: { ...game.awayTeam, score: Math.random() > 0.7 ? game.awayTeam.score! + 1 : game.awayTeam.score },
          homeTeam: { ...game.homeTeam, score: Math.random() > 0.7 ? game.homeTeam.score! + 1 : game.homeTeam.score }
        };
      }
      return game;
    });
  }
}

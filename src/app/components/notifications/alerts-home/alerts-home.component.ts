import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  movement?: {
    direction: 'up' | 'down';
    amount: string;
  };
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
}

export interface Settings {
  browserNotifications: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}
@Component({
  selector: 'app-alerts-home',
  standalone: true,
  imports: [],
  templateUrl: './alerts-home.component.html',
  styleUrl: './alerts-home.component.scss'
})
export class AlertsHomeComponent {
  // Component State
  notificationCount = 12;
  showLivePanel = true;
  showModal = false;
  modalType: 'notification-creator' | 'settings' = 'notification-creator';
  modalTitle = '';

  // Wizard State
  currentStep = 1;
  selectedGame: string | null = null;
  selectedAlertType: string | null = null;
  gameSearchQuery = '';
  filteredGames: Game[] = [];

  // Timer for live updates
  private liveUpdateTimer: any;

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
      awayTeam: {
        name: 'Lakers',
        abbreviation: 'LAL',
        record: '32-28',
        score: 98
      },
      homeTeam: {
        name: 'Warriors',
        abbreviation: 'GSW',
        record: '38-22',
        score: 102
      },
      bettingLines: [
        {
          label: 'Spread',
          value: 'GSW -4.5',
          movement: { direction: 'up', amount: '0.5' }
        },
        {
          label: 'Total',
          value: '215.5',
          movement: { direction: 'down', amount: '2.0' }
        },
        {
          label: 'Moneyline',
          value: 'GSW -180'
        }
      ],
      alerts: ['Score Updates', 'Line Changes', 'Game End', 'Overtime Alert'],
      activeAlerts: ['Score Updates', 'Game End']
    },
    {
      id: 'chiefs-bills',
      league: 'NFL',
      leagueIcon: '🏈',
      status: 'scheduled',
      statusText: 'Today 8:30 PM',
      awayTeam: {
        name: 'Chiefs',
        abbreviation: 'KC',
        record: '14-3'
      },
      homeTeam: {
        name: 'Bills',
        abbreviation: 'BUF',
        record: '13-4'
      },
      bettingLines: [
        {
          label: 'Spread',
          value: 'KC -2.5',
          movement: { direction: 'down', amount: '1.0' }
        },
        {
          label: 'Total',
          value: '48.5',
          movement: { direction: 'down', amount: '3.0' }
        }
      ],
      weather: '❄️ 28°F, Snow - High delay risk',
      injuries: '🏥 Mahomes (Questionable)',
      alerts: ['Game Start', 'Weather Updates', 'Lineup Changes', 'Line Threshold: ±1.5'],
      activeAlerts: ['Game Start', 'Weather Updates', 'Line Threshold: ±1.5']
    },
    {
      id: 'heat-sixers',
      league: 'NBA',
      leagueIcon: '🏀',
      status: 'scheduled',
      statusText: 'Tomorrow 7:00 PM',
      awayTeam: {
        name: 'Heat',
        abbreviation: 'MIA',
        record: '29-31'
      },
      homeTeam: {
        name: '76ers',
        abbreviation: 'PHI',
        record: '31-29'
      },
      bettingLines: [
        {
          label: 'Spread',
          value: 'PHI -3.0'
        },
        {
          label: 'Total',
          value: '212.5'
        }
      ],
      alerts: ['Game Start', 'Playoff Implications', 'Line Changes'],
      activeAlerts: ['Game Start', 'Playoff Implications']
    }
  ];

  liveUpdates: LiveUpdate[] = [
    {
      id: '1',
      time: '2 min ago',
      category: 'Line Change',
      text: 'Lakers vs Warriors spread moved to GSW -4.5'
    },
    {
      id: '2',
      time: '5 min ago',
      category: 'Weather',
      text: 'Chiefs vs Bills: Heavy snow warning issued'
    },
    {
      id: '3',
      time: '8 min ago',
      category: 'Arbitrage',
      text: '5.2% arbitrage opportunity detected'
    },
    {
      id: '4',
      time: '12 min ago',
      category: 'Injury',
      text: 'Mahomes upgraded to PROBABLE for tonight\'s game'
    }
  ];

  alertTypes: AlertType[] = [
    {
      id: 'game-events',
      icon: '🕐',
      title: 'Game Events',
      description: 'Start time, end, delays, overtime'
    },
    {
      id: 'score-updates',
      icon: '⚽',
      title: 'Score & Momentum',
      description: 'Goals, touchdowns, lead changes, runs'
    },
    {
      id: 'betting-lines',
      icon: '📈',
      title: 'Betting Lines',
      description: 'Spread, total, moneyline changes'
    },
    {
      id: 'player-performance',
      icon: '⭐',
      title: 'Player Performance',
      description: 'Milestones, injuries, prop bets'
    },
    {
      id: 'weather-conditions',
      icon: '🌦️',
      title: 'Weather & Conditions',
      description: 'Delays, wind, temperature alerts'
    },
    {
      id: 'market-insights',
      icon: '🎯',
      title: 'Market Insights',
      description: 'Sharp money, arbitrage, steam moves'
    }
  ];

  settings: Settings = {
    browserNotifications: true,
    emailNotifications: false,
    soundEnabled: true,
    quietHoursStart: '23:00',
    quietHoursEnd: '07:00'
  };

  ngOnInit(): void {
    this.filteredGames = [...this.games];
    this.startLiveUpdates();
  }

  ngOnDestroy(): void {
    this.stopLiveUpdates();
  }

  // Header Actions
  toggleNotifications(): void {
    console.log('Toggle notifications panel');
    // Implementation for showing/hiding notifications panel
  }

  openSettings(): void {
    this.modalType = 'settings';
    this.modalTitle = 'Settings';
    this.showModal = true;
  }

  // Modal Management
  openNotificationCreator(): void {
    this.modalType = 'notification-creator';
    this.modalTitle = 'Create Notification';
    this.resetWizard();
    this.showModal = true;
  }

  closeModal(event?: Event): void {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showModal = false;
    } else if (!event) {
      this.showModal = false;
    }
  }

  closeLivePanel(): void {
    this.showLivePanel = false;
  }

  // Game Interactions
  toggleAlert(gameId: string, alertName: string): void {
    const game = this.games.find(g => g.id === gameId);
    if (game) {
      const index = game.activeAlerts.indexOf(alertName);
      if (index > -1) {
        game.activeAlerts.splice(index, 1);
      } else {
        game.activeAlerts.push(alertName);
      }
    }
  }

  // Wizard Functions
  private resetWizard(): void {
    this.currentStep = 1;
    this.selectedGame = null;
    this.selectedAlertType = null;
    this.gameSearchQuery = '';
    this.filteredGames = [...this.games];
  }

  filterGames(): void {
    const query = this.gameSearchQuery.toLowerCase();
    this.filteredGames = this.games.filter(game =>
        game.awayTeam.name.toLowerCase().includes(query) ||
        game.homeTeam.name.toLowerCase().includes(query) ||
        game.league.toLowerCase().includes(query)
    );
  }

  selectGame(gameId: string): void {
    this.selectedGame = gameId;
  }

  selectAlertType(alertTypeId: string): void {
    this.selectedAlertType = alertTypeId;
  }

  nextStep(): void {
    if (this.selectedGame && this.currentStep === 1) {
      this.currentStep = 2;
    }
  }

  previousStep(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
    }
  }

  createNotification(): void {
    if (this.selectedGame && this.selectedAlertType) {
      console.log('Creating notification:', {
        game: this.selectedGame,
        alertType: this.selectedAlertType
      });

      // Update notification count
      this.notificationCount++;

      // Close modal
      this.showModal = false;

      // Here you would typically call a service to save the notification
      // this.notificationService.createNotification(...)
    }
  }

  saveSettings(): void {
    console.log('Saving settings:', this.settings);

    // Here you would typically call a service to save settings
    // this.settingsService.saveSettings(this.settings)

    this.showModal = false;
  }

  // Live Updates
  private startLiveUpdates(): void {
    this.liveUpdateTimer = setInterval(() => {
      this.addLiveUpdate();
    }, 15000); // Add new update every 15 seconds
  }

  private stopLiveUpdates(): void {
    if (this.liveUpdateTimer) {
      clearInterval(this.liveUpdateTimer);
    }
  }

  private addLiveUpdate(): void {
    const updates = [
      'Celtics vs Heat: Line moved to BOS -3.0 (was -2.5)',
      'Packers vs Bears: Weather alert - Wind gusts up to 25mph',
      'Yankees vs Red Sox: Pitcher change - Cole out, Schmidt in',
      'Suns vs Nuggets: Jokic questionable with back injury',
      'Cowboys vs Giants: Sharp money coming in on DAL +3',
      'Dodgers vs Padres: Rain delay expected at 7:30 PM',
      'Rams vs Seahawks: Wilson probable for Sunday\'s game'
    ];

    const categories = ['Line Change', 'Weather', 'Injury', 'Sharp Money', 'Roster'];

    const newUpdate: LiveUpdate = {
      id: Date.now().toString(),
      time: 'Just now',
      category: categories[Math.floor(Math.random() * categories.length)],
      text: updates[Math.floor(Math.random() * updates.length)]
    };

    // Add to beginning of array
    this.liveUpdates.unshift(newUpdate);

    // Keep only last 20 updates
    if (this.liveUpdates.length > 20) {
      this.liveUpdates = this.liveUpdates.slice(0, 20);
    }
  }

  // Utility method to simulate score updates for live games
  updateLiveGameScores(): void {
    this.games.forEach(game => {
      if (game.status === 'live' && game.awayTeam.score !== undefined && game.homeTeam.score !== undefined) {
        // Randomly update scores
        if (Math.random() > 0.7) {
          if (Math.random() > 0.5) {
            game.awayTeam.score!++;
          } else {
            game.homeTeam.score!++;
          }
        }
      }
    });
  }
}

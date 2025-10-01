import { Component } from '@angular/core';
import {StatusCardComponent} from "./status-card/status-card.component";
import {NgClass} from "@angular/common";


interface SystemStatus {
  status: 'operational' | 'partial' | 'offline' | 'unknown';
  message: string;
  subMessage: string;
}

interface System {
  name: string;
  icon: string;
  status: 'operational' | 'partial' | 'offline' | 'unknown';
  components?: ComponentStatus[];
  description?: string;
  uptime?: Uptime;
  incident?: Incident;
}

interface ComponentStatus {
  name: string;
  icon: string;
  description: string;
  status: 'operational' | 'partial' | 'offline' | 'unknown';
  lastUpdated: string;
}

interface Uptime {
  percentage: number;
  outages: number;
  downtime: string;
}

interface Incident {
  message: string;
  time: string;
}
@Component({
  selector: 'app-status',
  standalone: true,
  imports: [
    StatusCardComponent,
    NgClass
  ],
  templateUrl: './status.component.html',
  styleUrl: './status.component.scss'
})
export class StatusComponent {
  overallStatus: SystemStatus = {
    status: 'partial',
    message: 'Some systems are experiencing issues',
    subMessage: 'We\'re working to resolve the affected services'
  };

  timestamp = 'April 9, 2025 at 14:32:45 UTC';

  get statuses(): System[] {
    return [
      {
        name: 'Sports Data API',
        icon: 'fas fa-chart-line',
        status: 'partial',
        components: [
          { name: 'NFL Data', icon: 'fas fa-football-ball', description: 'Live scores, stats, and odds for NFL games', status: 'operational', lastUpdated: '10 min ago' },
          { name: 'NBA Data', icon: 'fas fa-basketball-ball', description: 'Live scores, stats, and odds for NBA games', status: 'partial', lastUpdated: '5 min ago' },
          { name: 'MLB Data', icon: 'fas fa-baseball-ball', description: 'Live scores, stats, and odds for MLB games', status: 'offline', lastUpdated: '2 min ago' },
          { name: 'NHL Data', icon: 'fas fa-hockey-puck', description: 'Live scores, stats, and odds for NHL games', status: 'operational', lastUpdated: '12 min ago' }
        ],
        uptime: { percentage: 98.5, outages: 3, downtime: '10h 57m' },
        incident: { message: 'MLB Data API is currently experiencing outages. Our engineering team is working to resolve the issue.', time: 'Identified 25 minutes ago' }
      },
      {
        name: 'Dashboards',
        icon: 'fas fa-tachometer-alt',
        status: 'partial',
        description: 'User interface for displaying betting data and analytics',
        uptime: { percentage: 97.2, outages: 4, downtime: '20h 10m' },
        incident: { message: 'Some dashboard features are currently unavailable. Our engineers are investigating the issue.', time: 'Identified 35 minutes ago' }
      },
      {
        name: 'Paper Betting',
        icon: 'fas fa-money-bill-wave',
        status: 'operational',
        description: 'Fantasy betting platform with virtual currency',
        uptime: { percentage: 99.7, outages: 1, downtime: '2h 10m' }
      },
      {
        name: 'Login & Authentication',
        icon: 'fas fa-sign-in-alt',
        status: 'operational',
        description: 'User login, registration, and session management',
        uptime: { percentage: 99.9, outages: 1, downtime: '43m' }
      }
    ];
  }

  refresh(): void {
    console.log('EventStatus refreshed');
  }
}

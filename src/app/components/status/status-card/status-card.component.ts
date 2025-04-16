import {Component, Input} from '@angular/core';
import {NgClass} from "@angular/common";

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
  selector: 'app-status-card',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './status-card.component.html',
  styleUrl: './status-card.component.scss'
})
export class StatusCardComponent {
  @Input({required: true}) system!: System;

  getStatusText(status: string): string {
    return status === 'operational' ? 'Fully Operational' :
        status === 'partial' ? 'Partially Operational' : 'Offline';
  }

  getComponentStatusText(status: string): string {
    return status === 'operational' ? 'Operational' :
        status === 'partial' ? 'Degraded' : 'Offline';
  }
}

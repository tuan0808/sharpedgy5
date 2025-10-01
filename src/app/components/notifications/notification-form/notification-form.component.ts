import {Component, computed, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NotificationType {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
  readonly color: string;
  readonly accent: string;
}

interface FormField {
  readonly key: string;
  readonly type: 'text' | 'number' | 'checkbox' | 'select';
  readonly label: string;
  readonly placeholder?: string;
  readonly helpText?: string;
  readonly defaultValue?: unknown;
  readonly options?: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly step?: string;
  readonly required?: boolean;
}

interface NotificationConfig {
  readonly id: string;
  readonly fields: ReadonlyArray<FormField>;
}

interface FormData {
  [key: string]: unknown;
}

type Step = 'selection' | 'configuration' | 'confirmation';
@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-preferences.component.html',
  styleUrls: ['./notification-preferences.component.css']
})
export class NotificationPreferencesComponent {
  // State signals
  readonly currentStep = signal<Step>('selection');
  readonly selectedType = signal<string>('');
  readonly formData = signal<FormData>({});
  readonly isConfirmed = signal<boolean>(false);

  // Static data
  readonly notificationTypes: ReadonlyArray<NotificationType> = [
    {
      id: 'SCORE_UPDATE',
      label: 'Score Updates',
      icon: 'target',
      description: 'Real-time score change notifications',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      accent: 'border-blue-200 hover:border-blue-400'
    },
    {
      id: 'GAME_START',
      fields: [
        {
          key: 'preGameReminder',
          type: 'select',
          label: 'Pre-Game Reminder',
          defaultValue: '',
          options: [
            { value: '', label: 'No reminder' },
            { value: '5_MINUTES', label: '5 Minutes Before' },
            { value: '15_MINUTES', label: '15 Minutes Before' },
            { value: '30_MINUTES', label: '30 Minutes Before' },
            { value: '1_HOUR', label: '1 Hour Before' }
          ]
        },
        {
          key: 'includeLineup',
          type: 'checkbox',
          label: 'Include starting lineup',
          defaultValue: false
        }
      ]
    },
    {
      id: 'GAME_END',
      fields: [
        {
          key: 'postGameDelay',
          type: 'select',
          label: 'Post-Game Delay',
          defaultValue: 'IMMEDIATE',
          options: [
            { value: 'IMMEDIATE', label: 'Immediate' },
            { value: '2_MINUTES', label: '2 Minutes' },
            { value: '5_MINUTES', label: '5 Minutes' },
            { value: '10_MINUTES', label: '10 Minutes' }
          ]
        },
        {
          key: 'includeStats',
          type: 'checkbox',
          label: 'Include final statistics',
          defaultValue: false
        }
      ]
    },
    {
      id: 'OVERTIME',
      fields: [
        {
          key: 'enableOvertimeAlerts',
          type: 'checkbox',
          label: 'Enable overtime alerts',
          defaultValue: true
        },
        {
          key: 'multipleOvertimeAlerts',
          type: 'checkbox',
          label: 'Alert for multiple overtime periods',
          defaultValue: false
        }
      ]
    },
    {
      id: 'TIMEOUT',
      fields: [
        {
          key: 'teamTimeouts',
          type: 'checkbox',
          label: 'Team timeouts',
          defaultValue: true
        },
        {
          key: 'officialTimeouts',
          type: 'checkbox',
          label: 'Official timeouts',
          defaultValue: false
        },
        {
          key: 'mediaTimeouts',
          type: 'checkbox',
          label: 'Media timeouts',
          defaultValue: false
        },
        {
          key: 'minimumTimeoutDuration',
          type: 'select',
          label: 'Minimum Timeout Duration',
          helpText: 'Only notify for timeouts longer than this duration',
          defaultValue: '1_MINUTE',
          options: [
            { value: '30_SECONDS', label: '30 Seconds' },
            { value: '1_MINUTE', label: '1 Minute' },
            { value: '2_MINUTES', label: '2 Minutes' },
            { value: 'ANY', label: 'Any Duration' }
          ]
        }
      ]
    },
    {
      id: 'INJURY',
      fields: [
        {
          key: 'majorInjuries',
          type: 'checkbox',
          label: 'Major injuries only',
          defaultValue: true
        },
        {
          key: 'keyPlayerInjuries',
          type: 'checkbox',
          label: 'Key player injuries',
          defaultValue: true
        },
        {
          key: 'injuryUpdates',
          type: 'checkbox',
          label: 'Injury status updates',
          defaultValue: false
        },
        {
          key: 'injurySeverityThreshold',
          type: 'select',
          label: 'Injury Severity Threshold',
          defaultValue: 'MODERATE',
          options: [
            { value: 'ANY', label: 'Any Injury' },
            { value: 'MINOR', label: 'Minor & Above' },
            { value: 'MODERATE', label: 'Moderate & Above' },
            { value: 'MAJOR', label: 'Major Only' }
          ]
        }
      ]
    },
    {
      id: 'WEATHER',
      fields: [
        {
          key: 'gameDelayWeather',
          type: 'checkbox',
          label: 'Game delays due to weather',
          defaultValue: true
        },
        {
          key: 'severeWeatherAlerts',
          type: 'checkbox',
          label: 'Severe weather alerts',
          defaultValue: true
        },
        {
          key: 'temperatureAlerts',
          type: 'checkbox',
          label: 'Extreme temperature alerts',
          defaultValue: false
        },
        {
          key: 'weatherUpdateFrequency',
          type: 'select',
          label: 'Weather Update Frequency',
          defaultValue: 'SIGNIFICANT_CHANGES',
          options: [
            { value: 'SIGNIFICANT_CHANGES', label: 'Significant Changes Only' },
            { value: 'HOURLY', label: 'Hourly Updates' },
            { value: 'PRE_GAME', label: 'Pre-Game Only' },
            { value: 'REAL_TIME', label: 'Real-Time Updates' }
          ]
        },
        {
          key: 'temperatureThreshold',
          type: 'number',
          label: 'Temperature Threshold (°F)',
          placeholder: '32',
          helpText: 'Alert when temperature goes below/above this value',
          defaultValue: 32
        }
      ]
    },
    {
      id: 'GAME_START',
      label: 'Game Start',
      icon: 'clock',
      description: 'Alerts when games begin',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      accent: 'border-green-200 hover:border-green-400'
    },
    {
      id: 'GAME_END',
      label: 'Game End',
      icon: 'clock',
      description: 'Notifications when games conclude',
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      accent: 'border-red-200 hover:border-red-400'
    },
    {
      id: 'MONEY_LINE',
      label: 'Money Line Changes',
      icon: 'trending-up',
      description: 'Track betting line movements',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      accent: 'border-purple-200 hover:border-purple-400'
    },
    {
      id: 'POINT_DIFF',
      label: 'Point Spread Changes',
      icon: 'trending-up',
      description: 'Monitor point spread fluctuations',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      accent: 'border-indigo-200 hover:border-indigo-400'
    },
    {
      id: 'OVER_UNDER',
      label: 'Over/Under Changes',
      icon: 'trending-up',
      description: 'Total points line adjustments',
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      accent: 'border-pink-200 hover:border-pink-400'
    },
    {
      id: 'BETTING_VOLUME',
      label: 'Betting Volume Spikes',
      icon: 'zap',
      description: 'Unusual betting activity alerts',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      accent: 'border-orange-200 hover:border-orange-400'
    },
    {
      id: 'START_END',
      label: 'Game Start & End',
      icon: 'clock',
      description: 'Combined game lifecycle alerts',
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      accent: 'border-teal-200 hover:border-teal-400'
    },
    {
      id: 'GAME_MILESTONE',
      label: 'Game Milestones',
      icon: 'target',
      description: 'Quarter ends, halftime events',
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      accent: 'border-cyan-200 hover:border-cyan-400'
    },
    {
      id: 'FINAL_SCORE',
      label: 'Final Score',
      icon: 'check',
      description: 'Game result notifications',
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      accent: 'border-emerald-200 hover:border-emerald-400'
    },
    {
      id: 'OVERTIME',
      label: 'Overtime',
      icon: 'clock',
      description: 'Extended play period alerts',
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
      accent: 'border-amber-200 hover:border-amber-400'
    },
    {
      id: 'TIMEOUT',
      label: 'Timeouts',
      icon: 'clock',
      description: 'Game pause notifications',
      color: 'bg-gradient-to-br from-slate-500 to-slate-600',
      accent: 'border-slate-200 hover:border-slate-400'
    },
    {
      id: 'INJURY',
      label: 'Injury Reports',
      icon: 'alert-triangle',
      description: 'Player injury updates',
      color: 'bg-gradient-to-br from-rose-500 to-rose-600',
      accent: 'border-rose-200 hover:border-rose-400'
    },
    {
      id: 'WEATHER',
      label: 'Weather Updates',
      icon: 'cloud-rain',
      description: 'Game weather conditions',
      color: 'bg-gradient-to-br from-sky-500 to-sky-600',
      accent: 'border-sky-200 hover:border-sky-400'
    }
  ];

  readonly notificationConfigs: ReadonlyArray<NotificationConfig> = [
    {
      id: 'SCORE_UPDATE',
      fields: [
        {
          key: 'incrementThreshold',
          type: 'number',
          label: 'Increment Threshold',
          placeholder: 'Enter threshold value',
          helpText: 'Minimum score change to trigger notification',
          defaultValue: 7,
          required: true
        },
        {
          key: 'realTimeUpdates',
          type: 'checkbox',
          label: 'Enable real-time updates',
          defaultValue: true
        },
        {
          key: 'onlySignificantScores',
          type: 'checkbox',
          label: 'Only significant score changes',
          defaultValue: false
        }
      ]
    },
    {
      id: 'MONEY_LINE',
      fields: [
        {
          key: 'threshold',
          type: 'number',
          label: 'Movement Threshold',
          placeholder: '15.0',
          helpText: 'Minimum line movement to trigger alert',
          defaultValue: 15.0,
          step: '0.1'
        },
        {
          key: 'minimumOddsValue',
          type: 'number',
          label: 'Minimum Odds Value',
          placeholder: '100.0',
          helpText: 'Only track lines above this value',
          defaultValue: 100.0
        },
        {
          key: 'trackFavoriteShift',
          type: 'checkbox',
          label: 'Track favorite shifts',
          defaultValue: true
        },
        {
          key: 'trackUnderdogShift',
          type: 'checkbox',
          label: 'Track underdog shifts',
          defaultValue: true
        }
      ]
    },
    {
      id: 'POINT_DIFF',
      fields: [
        {
          key: 'threshold',
          type: 'number',
          label: 'Movement Threshold',
          placeholder: '2.5',
          helpText: 'Points threshold for spread movement alerts',
          defaultValue: 2.5,
          step: '0.1'
        },
        {
          key: 'minimumGameTime',
          type: 'select',
          label: 'Minimum Game Time',
          helpText: 'Only track changes within this timeframe',
          defaultValue: '30_MINUTES_BEFORE',
          options: [
            { value: '30_MINUTES_BEFORE', label: '30 Minutes Before' },
            { value: '1_HOUR_BEFORE', label: '1 Hour Before' },
            { value: '2_HOURS_BEFORE', label: '2 Hours Before' }
          ]
        },
        {
          key: 'alertOnIncrease',
          type: 'checkbox',
          label: 'Alert on spread increase',
          defaultValue: true
        },
        {
          key: 'alertOnDecrease',
          type: 'checkbox',
          label: 'Alert on spread decrease',
          defaultValue: true
        }
      ]
    },
    {
      id: 'OVER_UNDER',
      fields: [
        {
          key: 'threshold',
          type: 'number',
          label: 'Movement Threshold',
          placeholder: '1.5',
          helpText: 'Points threshold for total line movement',
          defaultValue: 1.5,
          step: '0.1'
        },
        {
          key: 'alertOnIncrease',
          type: 'checkbox',
          label: 'Alert on total increase',
          defaultValue: true
        },
        {
          key: 'alertOnDecrease',
          type: 'checkbox',
          label: 'Alert on total decrease',
          defaultValue: true
        }
      ]
    },
    {
      id: 'BETTING_VOLUME',
      fields: [
        {
          key: 'volumeThreshold',
          type: 'number',
          label: 'Volume Threshold',
          placeholder: '200.0',
          helpText: 'Percentage increase to trigger volume spike alert',
          defaultValue: 200.0
        },
        {
          key: 'timeWindow',
          type: 'select',
          label: 'Time Window',
          helpText: 'Time period for volume analysis',
          defaultValue: '15_MINUTES',
          options: [
            { value: '5_MINUTES', label: '5 Minutes' },
            { value: '15_MINUTES', label: '15 Minutes' },
            { value: '30_MINUTES', label: '30 Minutes' },
            { value: '1_HOUR', label: '1 Hour' }
          ]
        }
      ]
    },
    {
      id: 'START_END',
      fields: [
        {
          key: 'gameStart',
          type: 'checkbox',
          label: 'Notify on game start',
          defaultValue: true
        },
        {
          key: 'gameEnd',
          type: 'checkbox',
          label: 'Notify on game end',
          defaultValue: true
        },
        {
          key: 'preGameReminder',
          type: 'select',
          label: 'Pre-Game Reminder',
          defaultValue: '',
          options: [
            { value: '', label: 'No reminder' },
            { value: '15_MINUTES', label: '15 Minutes Before' },
            { value: '30_MINUTES', label: '30 Minutes Before' },
            { value: '1_HOUR', label: '1 Hour Before' }
          ]
        },
        {
          key: 'finalScoreDelay',
          type: 'select',
          label: 'Final Score Delay',
          defaultValue: '',
          options: [
            { value: '', label: 'No delay' },
            { value: '2_MINUTES', label: '2 Minutes' },
            { value: '5_MINUTES', label: '5 Minutes' },
            { value: '10_MINUTES', label: '10 Minutes' }
          ]
        }
      ]
    },
    {
      id: 'GAME_MILESTONE',
      fields: [
        {
          key: 'quarterEnd',
          type: 'checkbox',
          label: 'Quarter end notifications',
          defaultValue: false
        },
        {
          key: 'halfTime',
          type: 'checkbox',
          label: 'Halftime notifications',
          defaultValue: false
        },
        {
          key: 'periodEnd',
          type: 'checkbox',
          label: 'Period end notifications',
          defaultValue: false
        },
        {
          key: 'overtime',
          type: 'checkbox',
          label: 'Overtime notifications',
          defaultValue: true
        },
        {
          key: 'twoMinuteWarning',
          type: 'checkbox',
          label: 'Two-minute warning',
          defaultValue: false
        }
      ]
    },
    {
      id: 'FINAL_SCORE',
      fields: [
        {
          key: 'includeStats',
          type: 'checkbox',
          label: 'Include game statistics',
          defaultValue: false
        },
        {
          key: 'delayAfterGameEnd',
          type: 'select',
          label: 'Delay After Game End',
          helpText: 'Wait time before sending final score',
          defaultValue: '2_MINUTES',
          options: [
            { value: 'IMMEDIATE', label: 'Immediate' },
            { value: '2_MINUTES', label: '2 Minutes' },
            { value: '5_MINUTES', label: '5 Minutes' },
            { value: '10_MINUTES', label: '10 Minutes' }
          ]
        }
      ]
    }
  ];

  // Computed values
  readonly selectedTypeConfig = computed(() =>
      this.notificationConfigs.find(config => config.id === this.selectedType())
  );

  readonly selectedTypeData = computed(() =>
      this.notificationTypes.find(type => type.id === this.selectedType())
  );

  readonly formDataEntries = computed(() =>
      Object.entries(this.formData())
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => ({ key, value }))
  );

  /**
   * Handles notification type selection and initializes form data
   */
  handleTypeSelection(typeId: string): void {
    this.selectedType.set(typeId);
    this.setCurrentStep('configuration');
    this.initializeFormDataForType(typeId);
  }

  /**
   * Sets the current step of the wizard
   */
  setCurrentStep(step: Step): void {
    this.currentStep.set(step);
  }

  /**
   * Initializes form data with default values for the selected type
   */
  private initializeFormDataForType(typeId: string): void {
    const config = this.notificationConfigs.find(c => c.id === typeId);
    if (!config) return;

    const initialData: FormData = {};
    config.fields.forEach(field => {
      initialData[field.key] = field.defaultValue;
    });

    this.formData.set(initialData);
  }

  /**
   * Proceeds to confirmation step
   */
  handleSubmit(): void {
    this.setCurrentStep('confirmation');
  }

  /**
   * Confirms and saves the configuration
   */
  handleConfirm(): void {
    this.isConfirmed.set(true);
    console.log('Submitted preferences:', {
      type: this.selectedType(),
      preferences: this.formData()
    });
  }

  /**
   * Resets the form to initial state
   */
  resetForm(): void {
    this.setCurrentStep('selection');
    this.selectedType.set('');
    this.formData.set({});
    this.isConfirmed.set(false);
  }

  /**
   * Gets the label of the selected notification type
   */
  getSelectedTypeLabel(): string {
    return this.selectedTypeData()?.label ?? '';
  }

  /**
   * Gets the description of the selected notification type
   */
  getSelectedTypeDescription(): string {
    return this.selectedTypeData()?.description ?? '';
  }

  /**
   * Gets the icon name of the selected notification type
   */
  getSelectedTypeIcon(): string {
    return this.selectedTypeData()?.icon ?? 'bell';
  }

  /**
   * Gets the current notification configuration
   */
  getCurrentNotificationConfig(): NotificationConfig | undefined {
    return this.selectedTypeConfig();
  }

  /**
   * Formats field names for display
   */
  formatFieldName(fieldName: string): string {
    return fieldName
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }

  /**
   * Gets form data entries for review
   */
  getFormDataEntries(): ReadonlyArray<{ readonly key: string; readonly value: unknown }> {
    return this.formDataEntries();
  }

  /**
   * Checks if a value is boolean
   */
  isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  /**
   * Gets SVG path for the given icon name
   */
  getIconPath(iconName: string): string {
    const iconPaths: Record<string, string> = {
      'target': 'M12 2L2 7v10c0 5.55 3.84 10 9 11 1.08.06 2.05.06 3 0 5.16-1 9-5.45 9-11V7l-10-5z',
      'clock': 'M12 6v6l4 2m6-6a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'trending-up': 'm3 17 6-6 4 4 8-8',
      'zap': 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
      'check': 'm5 13 4 4L19 7',
      'alert-triangle': 'm12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16c-.77.833.192 2.5 1.732 2.5z',
      'cloud-rain': 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M16 14v6m-4-2v4m-4-6v6',
      'bell': 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M13.73 21a2 2 0 0 1-3.46 0'
    };
    return iconPaths[iconName] ?? iconPaths['bell'];
  }
}

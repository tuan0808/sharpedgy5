import { Component } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  gameTime: Date;
  league: string;
}

@Component({
  selector: 'app-prediction',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgForOf
  ],
  templateUrl: './prediction.component.html',
  styleUrl: './prediction.component.scss'
})
export class PredictionComponent {
// Form state
  formData = {
    gameId: '',
    predictedWinner: '',
    confidence: 3,
    analysis: '',
    oddsHomeTeam: '',
    oddsAwayTeam: '',
    spreadFavorite: '',
    spreadPoints: '',
    overUnderTotal: '',
    recommendedBet: ''
  };

  // UI states
  upcomingGames: Game[] = [];
  isSubmitting = false;
  submitSuccess = false;
  errorMessage = '';

  // Confidence level options
  confidenceLevels = [
    { value: 1, label: '1 - Low Confidence' },
    { value: 2, label: '2 - Somewhat Confident' },
    { value: 3, label: '3 - Moderately Confident' },
    { value: 4, label: '4 - Very Confident' },
    { value: 5, label: '5 - Extremely Confident' }
  ];

  // Recommended bet options
  recommendedBetOptions = [
    { value: 'moneyline_home', label: 'Moneyline - Home Team' },
    { value: 'moneyline_away', label: 'Moneyline - Away Team' },
    { value: 'spread_favorite', label: 'Spread - Favorite' },
    { value: 'spread_underdog', label: 'Spread - Underdog' },
    { value: 'over', label: 'Over Total Points' },
    { value: 'under', label: 'Under Total Points' },
    { value: 'none', label: 'No Bet Recommended' }
  ];

  ngOnInit() {
    // Mock data - would normally be an API call
    this.upcomingGames = [
      {
        id: 1,
        homeTeam: 'Boston Celtics',
        awayTeam: 'LA Lakers',
        gameTime: new Date(Date.now() + 86400000),
        league: 'NBA'
      },
      {
        id: 2,
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
        gameTime: new Date(Date.now() + 172800000),
        league: 'NFL'
      },
      {
        id: 3,
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        gameTime: new Date(Date.now() + 259200000),
        league: 'Premier League'
      }
    ];
  }

  getSelectedGame(): Game | undefined {
    return this.upcomingGames.find(game => game.id.toString() === this.formData.gameId.toString());
  }

  handleSubmit(event: Event) {
    event.preventDefault();

    // Validation
    if (!this.formData.gameId || !this.formData.predictedWinner || !this.formData.analysis) {
      this.errorMessage = 'Please fill out all required fields';
      return;
    }

    if (this.formData.analysis.length < 20) {
      this.errorMessage = 'Analysis must be at least 20 characters';
      return;
    }

    if (
        (this.formData.oddsHomeTeam && isNaN(parseFloat(this.formData.oddsHomeTeam))) ||
        (this.formData.oddsAwayTeam && isNaN(parseFloat(this.formData.oddsAwayTeam))) ||
        (this.formData.spreadPoints && isNaN(parseFloat(this.formData.spreadPoints))) ||
        (this.formData.overUnderTotal && isNaN(parseFloat(this.formData.overUnderTotal)))
    ) {
      this.errorMessage = 'Betting odds must be valid numbers';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Simulated API call
    setTimeout(() => {
      console.log('Submitting prediction:', this.formData);
      this.isSubmitting = false;
      this.submitSuccess = true;

      this.resetForm();

      setTimeout(() => {
        this.submitSuccess = false;
      }, 3000);
    }, 1000);
  }

  resetForm() {
    this.formData = {
      gameId: '',
      predictedWinner: '',
      confidence: 3,
      analysis: '',
      oddsHomeTeam: '',
      oddsAwayTeam: '',
      spreadFavorite: '',
      spreadPoints: '',
      overUnderTotal: '',
      recommendedBet: ''
    };
    this.errorMessage = '';
  }

  formatGameTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  }
}

import { Component, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BetTypes } from '../../shared/model/enums/BetTypes';
import { Game } from '../../shared/model/paper-betting/Game';

interface BetTypeOption {
  id: BetTypes;
  label: string;
  icon: string;
  isEnabled: boolean;
}

@Component({
  selector: 'app-base-bet-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: ''
})
export abstract class BaseBetFormComponent {
  protected fb = inject(FormBuilder);

  @Input() game!: Game;
  bettingForm: FormGroup;
  selectedBetType = BetTypes.MONEYLINE;
  selectedTeam: any = null;
  potentialWinnings: number = 0;
  homeTeamWinProbability = 0;
  awayTeamWinProbability = 0;

  betTypes: BetTypeOption[] = [
    { id: BetTypes.MONEYLINE, label: 'Money Line', icon: '💰', isEnabled: true },
    { id: BetTypes.POINT_SPREAD, label: 'Point Spread', icon: '📊', isEnabled: true },
    { id: BetTypes.OVER_UNDER, label: 'Over/Under', icon: '⚖️', isEnabled: true },
    { id: BetTypes.PARLAY, label: 'Parlay', icon: '🎲', isEnabled: false },
    { id: BetTypes.TEASER, label: 'Teaser', icon: '🎯', isEnabled: false },
    { id: BetTypes.ROUND_ROBIN, label: 'Round Robin', icon: '🔄', isEnabled: false },
    { id: BetTypes.PLEASER, label: 'Pleaser', icon: '🎪', isEnabled: false }
  ];

  constructor() {
    this.bettingForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0), Validators.max(5000)]]
    });
    this.calculateWinProbabilities();
  }

  calculateWinProbabilities(): void {
    if (this.game && this.game.moneylineHome !== undefined && this.game.moneylineAway !== undefined) {
      const homeOdds = this.game.moneylineHome;
      const awayOdds = this.game.moneylineAway;

      let homeImpliedProb: number;
      let awayImpliedProb: number;

      if (homeOdds > 0) {
        homeImpliedProb = 100 / (homeOdds + 100);
      } else {
        homeImpliedProb = Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
      }

      if (awayOdds > 0) {
        awayImpliedProb = 100 / (awayOdds + 100);
      } else {
        awayImpliedProb = Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);
      }

      const overround = homeImpliedProb + awayImpliedProb;
      this.homeTeamWinProbability = (homeImpliedProb / overround) * 100;
      this.awayTeamWinProbability = (awayImpliedProb / overround) * 100;
    } else {
      this.homeTeamWinProbability = 0;
      this.awayTeamWinProbability = 0;
    }
  }

  setSelectedBetType(betType: BetTypes): void {
    this.selectedBetType = betType;
    this.updatePotentialWinnings();
  }

  setSelectedTeam(team: any): void {
    this.selectedTeam = team;
    this.calculateWinProbabilities();
    this.updatePotentialWinnings();
  }

  updatePotentialWinnings(): void {
    const amount = this.bettingForm.get('amount')?.value;
    if (!amount || !this.selectedTeam || isNaN(amount)) {
      this.potentialWinnings = 0;
      return;
    }

    const odds = parseInt(this.selectedTeam.odds, 10);
    if (isNaN(odds)) {
      this.potentialWinnings = 0;
      return;
    }

    let profit: number;
    if (odds > 0) {
      profit = (amount * odds) / 100;
    } else if (odds < 0) {
      profit = amount * (100 / Math.abs(odds));
    } else {
      profit = amount;
    }

    this.potentialWinnings = Math.round(profit * 100) / 100;
  }

  isFormValid(): boolean {
    return this.bettingForm.valid &&
        this.selectedTeam !== null &&
        this.bettingForm.get('amount')?.value > 0;
  }
}

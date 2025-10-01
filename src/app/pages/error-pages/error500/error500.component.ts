import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-error500',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './error500.component.html',
  styleUrls: ['./error500.component.scss']
})
export class Error500Component implements OnInit {
  timeRemaining = 1800; // 30 minutes in seconds
  countdownDisplay = '30:00';

  ngOnInit() {
    this.updateCountdown();
  }

  updateCountdown() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.countdownDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (this.timeRemaining > 0) {
      this.timeRemaining--;
      setTimeout(() => this.updateCountdown(), 1000);
    } else {
      this.countdownDisplay = "00:00";
      window.location.reload();
    }
  }

  checkStatus() {
    window.location.reload();
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-with-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-with-image.component.html',
  styleUrls: ['./page-with-image.component.scss']
})
export class PageWithImageComponent implements OnInit {
  
  public seconds: number;
  public interval: any

  constructor() {
    this.interval = setInterval(function (this: any) {
      let currentDate = new Date();
      currentDate.setHours(0);  // Set the desired hours
      currentDate.setMinutes(0); // Set the desired minutes
      currentDate.setSeconds(0);

      let nowDate = new Date();
      let daysToAdd = 7;
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      let distance = currentDate.getTime() - nowDate.getTime();
      this.document.querySelectorAll('#days').forEach((element: { innerHTML: Number }) => {
        element.innerHTML = Math.floor(distance / (1000 * 60 * 60 * 24));
      });

      this.document.querySelectorAll('#hours').forEach((element: { innerHTML: Number }) => {
        element.innerHTML = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      });

      this.document.querySelectorAll('#minutes').forEach((element: { innerHTML: Number }) => {
        element.innerHTML = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      });

      this.document.querySelectorAll('#seconds').forEach((element: { innerHTML: Number }) => {
        element.innerHTML = Math.floor((distance % (1000 * 60)) / 1000);
      });
    }, this.seconds);
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }


}

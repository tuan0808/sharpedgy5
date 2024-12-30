import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-error400',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './error400.component.html',
  styleUrls: ['./error400.component.scss']
})
export class Error400Component implements OnInit {

  constructor() { }

  ngOnInit() { }

}

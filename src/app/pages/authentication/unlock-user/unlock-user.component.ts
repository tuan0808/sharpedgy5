import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-unlock-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unlock-user.component.html',
  styleUrls: ['./unlock-user.component.scss']
})
export class UnlockUserComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}

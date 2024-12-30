import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-with-video',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-with-video.component.html',
  styleUrls: ['./login-with-video.component.scss']
})
export class LoginWithVideoComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}

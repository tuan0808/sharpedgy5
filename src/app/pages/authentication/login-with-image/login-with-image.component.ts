import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-with-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-with-image.component.html',
  styleUrls: ['./login-with-image.component.scss']
})
export class LoginWithImageComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}

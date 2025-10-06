import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-error404',
    imports: [CommonModule, RouterModule],
    templateUrl: './error404.component.html',
    styleUrls: ['./error404.component.scss']
})
export class Error404Component implements OnInit {

  constructor() { }

  ngOnInit() { }

}

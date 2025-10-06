import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-error503',
    imports: [CommonModule, RouterModule],
    templateUrl: './error503.component.html',
    styleUrls: ['./error503.component.scss']
})
export class Error503Component implements OnInit {

  constructor() { }

  ngOnInit() { }

}

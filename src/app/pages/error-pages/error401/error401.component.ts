import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-error401',
    imports: [CommonModule, RouterModule],
    templateUrl: './error401.component.html',
    styleUrls: ['./error401.component.scss']
})
export class Error401Component implements OnInit {

  constructor() { }

  ngOnInit() { }

}

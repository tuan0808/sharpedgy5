import {Component, Input, OnInit} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";

@Component({
    selector: 'app-teamcard',
    imports: [
        NgClass,
        NgIf
    ],
    templateUrl: './teamcard.component.html',
    styleUrl: './teamcard.component.css'
})
export class TeamcardComponent implements OnInit {
  @Input()
  game : any;

  ngOnInit(): void {
  }


}

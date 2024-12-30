import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-teamcard',
  standalone: true,
  imports: [],
  templateUrl: './teamcard.component.html',
  styleUrl: './teamcard.component.css'
})
export class TeamcardComponent implements OnInit {
  @Input()
  game : any;
  protected teamData : any[] = []
  homeTeam : any;
  awayTeam : any;

  ngOnInit() {
  }
  constructor() {

  }


}

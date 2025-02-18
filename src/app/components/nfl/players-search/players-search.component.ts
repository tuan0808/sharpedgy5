import {Component, Input, OnInit} from '@angular/core';
import {AutocompleteLibModule} from "angular-ng-autocomplete";
import {NflDataService} from "../../../shared/services/nfl-data.service";
import {AsyncPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {MdbRippleModule} from "mdb-angular-ui-kit/ripple";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-players-search',
    standalone: true,
    imports: [
        AutocompleteLibModule,
        NgClass,
        NgForOf,
        MdbRippleModule,
        AsyncPipe,
        RouterLink,
        NgIf
    ],
    templateUrl: './players-search.component.html',
    styleUrl: './players-search.component.scss',
    animations: [
        trigger('slideInOut', [
            state('in', style({transform: 'translateX(0)'})),
            state('out', style({transform: 'translateX(100%)'})),
            transition('in => out', animate('200ms ease-in-out')),
            transition('out => in', animate('200ms ease-in-out'))
        ])
    ]
})
export class PlayersSearchComponent implements OnInit {
    protected letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    protected currentIndex = 'a'
    protected selectedPlayers: Observable<any[]>
    protected keyword = "name"
    protected autocomplete: any[] = []
    protected playerData: Observable<any[]> = new Observable<any[]>()
    @Input()
    team: string = ""
    isVisible = true;


    constructor(private nflService: NflDataService) {

    }

    ngOnInit(): void {
        this.nflService.getPlayersbyAvailable(this.team).then(t => {
            this.playerData = t
            t.subscribe(s=>console.log(s))
            if (this.team != "") {
                this.selectedPlayers = t
            } else {
                this.setCurrentLetter('a')
            }
        })

    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
    }

    selectEvent(search: any) {
        this.selectedPlayers = this.fetchSelectedPlayers(search)
    }

    onChangeSearch(search: string) {
        this.selectedPlayers = this.fetchSelectedPlayers(search)
    }

    fetchSelectedPlayers(search: string) {
        return this.selectedPlayers = this.playerData.pipe(
            map(m => m.filter(f => f.Name.includes(search))
            )
        )
    }

    onFocused(e: any) {
        // do something
    }

    setCurrentLetter(letter: string) {
        this.currentIndex = letter
        if (letter === 'all') {
            this.selectedPlayers = this.playerData
            return;
        }
        this.selectedPlayers = this.playerData.pipe(
            map(m => m.filter(f => f.LastName.charAt(0).toLowerCase() === letter)
            )
        )
    }


}

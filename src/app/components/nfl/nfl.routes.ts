import {Routes} from "@angular/router";
import {ScoresComponent} from "./scores/scores.component";
import {TransactionsComponent} from "./transactions/transactions";
import {TeamStatsComponent} from "./team-stats/team-stats.component";
import {TeamsComponent} from "./teams/teams.component";
import {StandingComponent} from "./standing/standing.component";
import {ScheduleComponent} from "./schedule/Schedule.component";
import {PlayersSearchComponent} from "./players-search/players-search.component";
import {PlayersComponent} from "./players/players.component";
import {InjuriesComponent} from "./injuries/injuries.component";
import {NewsComponent} from "./news/news.component";


export const nflRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'news',
                component: NewsComponent,
                data: {
                    title: "news",
                    breadcrumb: "news",
                }
            },
            {
                path: 'injuries',
                component: InjuriesComponent,
                data: {
                    title: "injuries",
                    breadcrumb: "injuries",
                }
            },
            {
                path: 'players',
                component: PlayersComponent,
                data: {
                    title: "players",
                    breadcrumb: "players",
                }
            },
            {
                path: 'player-search',
                component: PlayersSearchComponent  ,
                data: {
                    title: "player search",
                    breadcrumb: "player search",
                }
            },
            {
                path: 'schedule',
                component: ScheduleComponent,
                data: {
                    title: "schedule",
                    breadcrumb: "Default",
                }
            },
            {
                path: 'scores',
                component: ScoresComponent,
                data: {
                    title: "scores",
                    breadcrumb: "scores",
                }
            },
            {
                path: 'standing',
                component: StandingComponent,
                data: {
                    title: "standing",
                    breadcrumb: "standing",
                }
            },
            {
                path: 'teams',
                component: TeamsComponent,
                data: {
                    title: "teams",
                    breadcrumb: "teams",
                }
            },
            {
                path: 'team-stats',
                component: TeamStatsComponent,
                data: {
                    title: "team stats",
                    breadcrumb: "team stats",
                }
            },
            {
                path: 'transactions',
                component: TransactionsComponent,
                data: {
                    title: "Transactions",
                    breadcrumb: "Default",
                }
            },

        ]
    }
]

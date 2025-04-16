import { Routes } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {AchievementsComponent} from "./achievements/achievements.component";
import {VirtualWalletComponent} from "./virtual-wallet/virtual-wallet.component";
import {BettingHistoryComponent} from "./betting-history/betting-history.component";
import {BettingRankingsComponent} from "./rankings/betting-rankings.component";

export const paperBettingRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'home',
                component: HomeComponent,
                data: {
                    title: "home",
                    breadcrumb: "home"
                }
            },
            {
                path: 'achievements',
                component: AchievementsComponent,
                data: {
                    title: "Achievements",
                    breadcrumb: "achievements"
                }
            },
            {
                path: 'history',
                component: BettingHistoryComponent,
                data: {
                    title: "History",
                    breadcrumb: "history"
                }

            },
            {
                path: 'virtual-wallet',
                component: VirtualWalletComponent,
                data: {
                    title: "Virtual Wallet",
                    breadcrumb: "virtual-wallet"
                }
            },
            {
                path: 'rankings',
                component: BettingRankingsComponent,
                data: {
                    title: "Rankings",
                    breadcrumb: "rankings"
                }
            }
        ]
    }
]

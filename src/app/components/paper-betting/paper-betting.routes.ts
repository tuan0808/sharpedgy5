import { Routes } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {AchievementsComponent} from "./achievements/achievements.component";
import {EducationalContentComponent} from "./educational-content/educational-content.component";
import {HistoryComponent} from "./history/history.component";
import {VirtualWalletComponent} from "./virtual-wallet/virtual-wallet.component";

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
                path: 'educational-content',
                component: EducationalContentComponent,
                data: {
                    title: "Educational Content",
                    breadcrumb: "educational-content"
                }
            },
            {
                path: 'history',
                component: HistoryComponent,
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
            }
        ]
    }

]

import { Routes } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {AchievementsComponent} from "./achievements/achievements.component";
import {EducationalContentComponent} from "./educational-content/educational-content.component";
import {VirtualWalletComponent} from "./virtual-wallet/virtual-wallet.component";
import {BettingHistoryComponent} from "./betting-history/betting-history.component";
import {betSettlementResolver} from "../../shared/user.resolver";
import {canActivate} from "@angular/fire/auth-guard";
import {authGuard} from "../../shared/guard/UserGuard";
import {LoginComponent} from "../../auth/login/login.component";

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
                },
                resolve: { account: betSettlementResolver}
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
            }
        ]
    }
]

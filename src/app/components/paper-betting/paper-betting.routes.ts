import { Routes } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {AchievementsComponent} from "./achievements/achievements.component";
import {EducationalContentComponent} from "./educational-content/educational-content.component";
import {VirtualWalletComponent} from "./virtual-wallet/virtual-wallet.component";
import {betSettlementResolver} from "../../shared/user.resolver";
import {canActivate} from "@angular/fire/auth-guard";
import {authGuard} from "../../shared/guard/AuthGuard";
import {LoginComponent} from "../../auth/login/login.component";
import {BettingHistoryComponent} from "./betting-history/betting-history.component";
import {HealthCheckDirective} from "../../shared/directives/HealthCheckDirective";

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
                },
                resolve: { account: betSettlementResolver}
            },
            {
                path: 'educational-content',
                component: EducationalContentComponent,
                data: {
                    title: "Educational Content",
                    breadcrumb: "educational-content"
                },
                resolve: { account: betSettlementResolver}
            },
            {
                path: 'history',
                component: BettingHistoryComponent,
                data: {
                    title: "History",
                    breadcrumb: "history"
                },
                resolve: { account: betSettlementResolver}

            },
            {
                path: 'virtual-wallet',
                component: VirtualWalletComponent,
                data: {
                    title: "Virtual Wallet",
                    breadcrumb: "virtual-wallet"
                },
                resolve: { account: betSettlementResolver}
            }
        ]
    }
]

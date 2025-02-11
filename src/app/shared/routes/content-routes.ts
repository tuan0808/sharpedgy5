import { Routes } from '@angular/router';
import {paperBettingRoutes} from "../../components/paper-betting/paper-betting.routes";

export const content: Routes = [
    {
        path: 'dashboard',
        data: {
            breadcrumb: "Dashboard"
        },
        loadChildren: () => import('../../../app/components/dashboard/dashboard.routes').then(r => r.dashboard)
    },
    {
        path: 'nfl',
        loadChildren: () => import('../../components/nfl/nfl.routes').then(r=>r.nflRoutes),
        data: {
            breadcrumb: "NFL"
        }
    },
    {
        path: 'paper-betting',
        loadChildren: () => import('../../components/paper-betting/paper-betting.routes').then(r=>r.paperBettingRoutes),
        data: {
            breadcrumb: "paper-betting"
        }
    },

]

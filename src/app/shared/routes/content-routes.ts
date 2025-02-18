import { Routes } from '@angular/router';
import {paperBettingRoutes} from "../../components/paper-betting/paper-betting.routes";
import firebase from "firebase/compat";
import auth = firebase.auth;
import {authGuard} from "../guard/UserGuard";

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
        canActivate: [authGuard],
        loadChildren: () => import('../../components/paper-betting/paper-betting.routes').then(r=>r.paperBettingRoutes),
        data: {
            breadcrumb: "paper-betting"
        }
    },

]

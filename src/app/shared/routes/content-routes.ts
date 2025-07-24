 import { Routes } from '@angular/router';
import {authGuard} from "../guard/AuthGuard";
import {adminGuard} from "../guard/admin.guard";
import {StatusComponent} from "../../components/status/status.component";

export const content: Routes = [
    // {
    //     path: '',
    //     pathMatch: 'full',
    //     redirectTo: '/dashboard'
    // },
    {
        path: 'dashboard',
        canActivate: [authGuard],
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
    {
        path: 'notifications',
        canActivate: [authGuard],
        data: {
            breadcrumb: "notifications"
        },
        loadChildren: () => import('../../components/notifications/notifications.routes').then(r => r.notificationsRoutes)
    },
    {
        path: 'admin',
        // canActivate: [adminGuard],
        loadChildren: () => import('../../components/admin/admin.routes').then(r=>r.adminRoutes),
        data: {
            breadcrumb: "admin"
        }
    },
    {
        path: 'status',
        pathMatch: 'full',
        component: StatusComponent, // Changed from redirectTo to load StatusPageComponent
        data: {
            breadcrumb: "Status"
        }
    },

]

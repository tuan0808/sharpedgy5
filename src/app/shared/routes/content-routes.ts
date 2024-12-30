import { Routes } from '@angular/router';

export const content: Routes = [
    {
        path: 'dashboard',
        data: {
            breadcrumb: "Dashboard"
        },
        loadChildren: () => import('../../../app/components/dashboard/dashboard.routes').then(r => r.dashboard)
    },
]

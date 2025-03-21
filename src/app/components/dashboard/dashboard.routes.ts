import { Routes } from '@angular/router';
import { DefaultComponent } from './default/default.component';

export const dashboard: Routes = [
    {
        path: '',
        component: DefaultComponent, // Render DefaultComponent directly at /dashboard
        data: {
            title: "Custom Dashboard",
            breadcrumb: "Custom Dashboard"
        }
    }
];

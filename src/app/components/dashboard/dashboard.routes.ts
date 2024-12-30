import { Routes } from '@angular/router';
import { DefaultComponent } from './default/default.component';

export const dashboard: Routes = [
    {
        path: '',
        children: [
          {
            path: '',
            component: DefaultComponent,
            data: {
              title: "Custom Dashboard",
              breadcrumb: "Custom Dashboard"
            }
          }
        ]
      }
];

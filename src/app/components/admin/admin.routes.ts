import {Routes} from "@angular/router";
import {PredictionComponent} from "./prediction/prediction.component";
import {UserManagerComponent} from "./user-manager/user-manager.component";


export const adminRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'prediction',
                component: PredictionComponent,
                data: { title: "Predictions", breadcrumb: "prediction" }
            },
            {
                path: 'user-manager',
                component: UserManagerComponent,
                data: { title: "User Manager", breadcrumb: "user-manager" }
            }
        ]
    }
];

import {Routes} from "@angular/router";
import {PredictionComponent} from "./prediction/prediction.component";


export const adminRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'prediction',
                component: PredictionComponent,
                data: {
                    title: "Prediction",
                    breadcrumb: "prediction",
                }
            }
        ]
    }
]

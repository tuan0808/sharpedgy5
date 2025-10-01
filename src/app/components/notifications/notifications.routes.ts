import {Routes} from "@angular/router";
import {NotificationHomeComponent} from "./notification-home/notification-home.component";
import {CreateNotificationComponent} from "./create-notification/create-notification.component";



export const notificationsRoutes : Routes = [
    {
        path: '',
        children: [
            {
                path: 'home',
                component: NotificationHomeComponent,
                data: { title: "Notifications", breadcrumb: "notifications" }
            },
            {
                path: 'create',
                component: CreateNotificationComponent,
                data: { title: "Create Notification", breadcrumb: "create-notification" }
            }
        ]
    }
];

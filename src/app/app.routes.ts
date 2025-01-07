import { Routes } from '@angular/router';
import { ContentLayoutComponent } from './shared/components/layout/content-layout/content-layout.component';
import { content } from './shared/routes/content-routes';
import { FullLayoutComponent } from './shared/components/layout/full-layout/full-layout.component';
import { fullRoutes } from './shared/routes/full.routes';
import { AdminGuard } from './shared/guard/admin.guard';
import { LoginComponent } from './auth/login/login.component';
import {RegisterComponent} from "./auth/register/register.component";
import {VerificationComponent} from "./auth/verification/verification.component";
import {ResetPwdComponent} from "./auth/reset-pwd/reset-pwd.component";
import {PopupGridComponent} from "./components/dashboard/popup-grid/popup-grid.component";

export const routes: Routes = [
    {
        path: "",
        redirectTo: "/dashboard/default",
        pathMatch: "full",
    },
    {
        path: "auth/login",
        component: LoginComponent,
    },
    {
        path: "auth/register",
        component: RegisterComponent
    },
    {
        path: "auth/recover/",
        component: ResetPwdComponent
    },
    {
        path: "auth/convinceUrNotARobot",
        component: VerificationComponent
    },
    {
        path: '',
        component: ContentLayoutComponent,
        //canActivate: [AdminGuard],
        children: content,
    },
    {
        path: '',
        component: FullLayoutComponent,
        //canActivate: [AdminGuard],
        children: fullRoutes,
    },
    {
        path: 'popup-grid',
        component: PopupGridComponent,
        children: content
    }
];

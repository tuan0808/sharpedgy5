import { Routes } from '@angular/router';
import { UsersProfileComponent } from './users-profile/users-profile.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { UserCardsComponent } from './user-cards/user-cards.component';

export const User: Routes = [

    {
        path: '',
        children: [
            {
                path: 'profile',
                component: UsersProfileComponent,
                data: {
                    title: "Profile",
                    breadcrumb: "Profile"
                }
            },
            {
                path: 'edit',
                component: UserEditComponent,
                data: {
                    title: "Edit",
                    breadcrumb: "Edit"
                }
            },
            {
                path: 'cards',
                component: UserCardsComponent,
                data: {
                    title: "Cards",
                    breadcrumb: "Cards"
                }
            }
        ]
    }

]
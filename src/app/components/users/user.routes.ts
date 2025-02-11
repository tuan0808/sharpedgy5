import { Routes } from '@angular/router';
import { UsersProfileComponent } from './users-profile/users-profile.component';
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

import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LoginWithImageComponent } from './login-with-image/login-with-image.component';
import { LoginWithVideoComponent } from './login-with-video/login-with-video.component';
import { RegisterComponent } from './register/register.component';
import { RegisterWithVideoComponent } from './register-with-video/register-with-video.component';
import { UnlockUserComponent } from './unlock-user/unlock-user.component';

export const authentication: Routes = [
    {
        path: '',
        children: [
          {
            path: 'login',
            component: LoginComponent,
          },
          {
            path: 'login/image',
            component: LoginWithImageComponent,
    
          },
          {
            path: 'login/video',
            component: LoginWithVideoComponent
          },
          {
            path: 'register',
            component: RegisterComponent,
          },
          {
            path: 'register/video',
            component: RegisterWithVideoComponent
          },
          {
            path: 'unlockuser',
            component: UnlockUserComponent
          },
        ]
      }
]

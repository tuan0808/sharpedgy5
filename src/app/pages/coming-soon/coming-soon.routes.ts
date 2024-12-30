import { Routes } from "@angular/router";
import { SimpleComponent } from './simple/simple.component';
import { PageWithVideoComponent } from './page-with-video/page-with-video.component';
import { PageWithImageComponent } from './page-with-image/page-with-image.component';

export const comingsoonPages: Routes = [
    {
        path: '',
        children: [
            {
                path: 'page',
                component: SimpleComponent
            },
            {
                path: 'page/image',
                component: PageWithImageComponent
            },
            {
                path: 'page/video',
                component: PageWithVideoComponent
            }
        ]
    }
]
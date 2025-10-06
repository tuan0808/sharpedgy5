import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

console.log('Starting main.ts');

(window as any).global = window;
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

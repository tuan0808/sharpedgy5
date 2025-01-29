import {inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from "@angular/common";
declare global {
  interface Window {
    USW?: {
      (method: string, selector: string, widgetType: string, options: Record<string, unknown>): void;
      q?: any[];
      l?: number;
    };
  }
}

export interface WidgetOptions {
  border?: boolean;
  matchId: number;
  language?: string;
}
@Injectable({
  providedIn: 'root'
})
export class WidgetService {
  private platformId = inject(PLATFORM_ID);
  private scriptLoaded = false;
  private scriptPromise: Promise<void> | null = null;

  loadWidgetScript(clientAlias: string, language: string = 'en_us'): Promise<void> {
    // Ensure we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    // If script is already loaded, return immediately
    if (this.scriptLoaded) {
      return Promise.resolve();
    }

    // If script loading is in progress, return the existing promise
    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    // Create a new promise to load the script
    this.scriptPromise = new Promise<void>((resolve, reject) => {
      // Polyfill for USW loading mechanism
      if (!window.USW) {
        window.USW = function() {
          (window.USW.q = window.USW.q || []).push(arguments);
        };
        window.USW.l = Date.now();
      }

      const script = document.createElement('script');
      script.src = `https://widgets.media.sportradar.com/${clientAlias}/widgetloader`;
      script.async = true;
      script.setAttribute('data-sr-language', language);

      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };

      script.onerror = (error) => {
        console.error('Failed to load Sportradar widget script', error);
        this.scriptPromise = null;
        reject(error);
      };

      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  initializeWidget(
      selector: string,
      widgetType: string,
      options: WidgetOptions
  ): Promise<void> {
    // Ensure we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const attempts = 10;
      let currentAttempt = 0;

      const tryInitWidget = () => {
        currentAttempt++;

        if (window.USW) {
          try {
            window.USW('addWidget', selector, widgetType, {
              border: options.border ?? true,
              matchId: options.matchId,
              language: options.language ?? 'en_us'
            });
            resolve();
          } catch (error) {
            console.error('Failed to initialize widget', error);
            reject(error);
          }
        } else if (currentAttempt < attempts) {
          // Retry with exponential backoff
          setTimeout(tryInitWidget, Math.pow(2, currentAttempt) * 100);
        } else {
          const error = new Error('USW not available after multiple attempts');
          console.error(error);
          reject(error);
        }
      };

      tryInitWidget();
    });
  }
}

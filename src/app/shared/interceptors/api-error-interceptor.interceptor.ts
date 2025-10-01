import {HttpInterceptorFn, HttpResponse} from '@angular/common/http';
import { inject } from '@angular/core';
import {catchError, tap} from 'rxjs/operators';
import { throwError } from 'rxjs';
import {SiteStatusService} from "../services/site-status.service";
export const apiErrorInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
    const siteStatusService = inject(SiteStatusService);

    return next(req).pipe(
        tap(event => {
            // Reset status on success
            if (event instanceof HttpResponse) {
                if (isExternalApi(req.url)) {
                    siteStatusService.setExternalApiDown(false);
                } else if (isInternalApi(req.url)) {
                    siteStatusService.setInternalApiDown(false);
                }
            }
        }),
        catchError(error => {
            // Set status on failure
            if (error.status === 0 || error.status >= 500) {
                if (isExternalApi(req.url)) {
                    siteStatusService.setExternalApiDown(true);
                } else if (isInternalApi(req.url)) {
                    siteStatusService.setInternalApiDown(true);
                }
            }
            return throwError(() => error);
        })
    );
};

// Pure helper functions
function isExternalApi(url: string): boolean {
    const externalDomains = ['nfl', 'mlb', 'nhl', 'nba']; // Replace with actual domains
    return externalDomains.some(domain => url.includes(domain));
}

function isInternalApi(url: string): boolean {
    const internalDomains = ['internal-api', 'localhost']; // Replace with actual internal API domain
    return internalDomains.some(domain => url.includes(domain));
}

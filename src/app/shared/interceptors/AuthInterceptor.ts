import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {from, Observable} from "rxjs";
import {AuthService} from "../services/auth.service";
import {switchMap} from "rxjs/operators";
import {Injectable} from "@angular/core";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.url.includes('/api/private')) {
            return from(this.authService.getUID()).pipe(
                switchMap(uid => {
                    if (!uid) return next.handle(req);
                    return from(this.authService.ensureAuthInitialized().then(() => this.authService.auth.currentUser?.getIdToken())).pipe(
                        switchMap(token => {
                            if (token) {
                                const authReq = req.clone({
                                    setHeaders: { Authorization: `Bearer ${token}` }
                                });
                                return next.handle(authReq);
                            }
                            return next.handle(req);
                        })
                    );
                })
            );
        }
        return next.handle(req);
    }
}

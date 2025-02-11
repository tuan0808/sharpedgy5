import {AuthError} from "@angular/fire/auth";

export interface AuthErrorDetail extends AuthError {
    name: string;
    code: string;
    message: string;
    stack?: string;
}

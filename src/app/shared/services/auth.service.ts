import {Injectable, Optional} from '@angular/core';
import {
    Auth,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    createUserWithEmailAndPassword,
    User,UserInfo, sendPasswordResetEmail
} from "@angular/fire/auth";
import {Router} from "@angular/router";
import {BehaviorSubject, EMPTY, Observable, of} from "rxjs";



@Injectable({
    providedIn: 'root'
})
export class AuthService {
    currentUser : Observable<User> = of()
    isLoggedIn : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
    constructor(@Optional() private auth: Auth, private router: Router) {

    }

    async loginWithEmail(email: string, password: string, redirect = '/home'): Promise<boolean> {
        await signInWithEmailAndPassword(this.auth, email, password).then(uc => {
            this.isLoggedIn.next(true)
            this.currentUser = of(uc.user)
            this.router.navigate(["/dashboard/default"])
            return true
        }).catch(e => console.log(e))
        return false
    }

    async recoverAccount(email : string) {
        await sendPasswordResetEmail(this.auth, email).then(s=>
            this.router.navigate(["/auth/login"])
        )
    }


    async signInWithPopup(provider: any) {
        await signInWithPopup(this.auth, provider).then(uc => {
            this.isLoggedIn.next(true)
            this.currentUser = of(uc.user)
            this.router.navigate(["/dashboard/default"])
            return true
        }).catch(e => console.log(e))
    }


    async logout() {
        this.isLoggedIn.next(false)
        this.currentUser = of()

        await signOut(this.auth)

    }

    async register(email: string, password: string) {
        await createUserWithEmailAndPassword(this.auth, email, password).then(uc => {
            this.router.navigate(['auth/convinceUrNotARobot'])
        })
    }
}

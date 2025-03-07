 import {inject, Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChildFn} from "@angular/router";
import { Observable } from "rxjs";
 import {Auth, getIdTokenResult, onAuthStateChanged} from "@angular/fire/auth";
 import {AuthService} from "../services/auth.service";

 export const adminGuard: CanActivateChildFn = async (route, state) => {
   const auth = inject(AuthService);
   const router = inject(Router);

   // Ensure auth is initialized (lazy init)
   await auth.ensureAuthInitialized();

   // Check if user is authenticated
   if (!auth.isAuthenticated()) {
       console.log('not authenticated')
     // Capture the attempted URL for redirect after login
     const attemptedUrl = state.url;
     auth.setRedirectUrl(attemptedUrl);

     // Navigate to login page
     await auth.showLoginForm();
     return false;
   }
     console.log(`is admin? ${auth.isAdmin}`)

   // Check if user is an admin
   if (auth.isAdmin()) {
       console.log('they are an admin!')

       return true; // Allow access
   } else {
     // Redirect non-admins to home
     await router.navigate(['/']);
     return false;
   }
 };

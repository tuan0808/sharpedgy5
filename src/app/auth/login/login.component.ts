import {Component, computed, inject, Injectable, signal} from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  User,
  onAuthStateChanged,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  AuthProvider,
  AuthError,
} from "@angular/fire/auth";
import {ActivatedRoute, Router} from "@angular/router";
import { Observable, firstValueFrom, interval } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, take } from "rxjs/operators";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {AuthService} from "../../shared/services/auth.service";

// Type definitions for better error handling
interface AuthErrorDetail {
  name: string;
  code: string;
  message: string;
  stack?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  //Injectors
  private fb : FormBuilder = inject(FormBuilder)
  private authService : AuthService = inject(AuthService)
  private router : Router = inject(Router)
  private route : ActivatedRoute = inject(ActivatedRoute)
  loginForm: FormGroup;
  loginError = signal<string | null>(null);
  isLoading = signal(false);

  constructor(

  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private async navigateAfterLogin() {
    // Check for returnUrl in query params
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      await this.router.navigate([returnUrl]);
    } else {
      await this.router.navigate(['/dashboard']);
    }
  }


  async login() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.loginError.set(null);

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.loginWithEmail(email, password);
      await this.navigateAfterLogin();
    } catch (error: any) {
      this.loginError.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  async googleLogin() {
    try {
      this.isLoading.set(true);
      this.loginError.set(null);
      await this.authService.loginWithGoogle();
      await this.navigateAfterLogin();
    } catch (error: any) {
      this.loginError.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'auth/popup-closed-by-user':
        return 'Login cancelled';
      default:
        return 'An error occurred during login';
    }
  }
}

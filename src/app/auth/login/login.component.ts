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
    imports: [
        ReactiveFormsModule
    ],
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  loginError = signal<string | null>(null);
  isLoading = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
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
      console.error('Email login error:', error);
      this.loginError.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  async googleLogin() {
    this.isLoading.set(true);
    this.loginError.set(null);

    try {
      const user = await this.authService.loginWithGoogle();
      console.log('Google login succeeded, UID:', user.uid);
      await this.navigateAfterLogin();
      setTimeout(() => {
        if (this.isLoading() === false) {
          this.loginError.set('Login successful! Please close the Google popup if it remains open.');
        }
      }, 1000);
    } catch (error: any) {
      console.error('Google login error:', error);
      this.loginError.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  async facebookLogin() {
    this.isLoading.set(true);
    this.loginError.set(null);
    try {
      const user = await this.authService.loginWithFacebook();
      console.log('Facebook login succeeded, UID:', user.uid);
      await this.navigateAfterLogin();
      setTimeout(() => {
        if (!this.isLoading()) {
          this.loginError.set('Login successful! Please close the Facebook popup if it remains open.');
        }
      }, 1000);
    } catch (error: any) {
      console.error('Facebook login error:', error);
      this.loginError.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  async appleLogin() {
    this.isLoading.set(true);
    this.loginError.set(null);
    try {
      const user = await this.authService.loginWithApple();
      console.log('Apple login succeeded, UID:', user.uid);
      await this.navigateAfterLogin();
      setTimeout(() => {
        if (!this.isLoading()) {
          this.loginError.set('Login successful! Please close the Apple popup if it remains open.');
        }
      }, 1000);
    } catch (error: any) {
      console.error('Apple login error:', error);
      this.loginError.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  async githubLogin() {
    this.isLoading.set(true);
    this.loginError.set(null);
    try {
      const user = await this.authService.loginWithGithub();
      console.log('GitHub login succeeded, UID:', user.uid);
      await this.navigateAfterLogin();
      setTimeout(() => {
        if (!this.isLoading()) {
          this.loginError.set('Login successful! Please close the GitHub popup if it remains open.');
        }
      }, 1000);
    } catch (error: any) {
      console.error('GitHub login error:', error);
      this.loginError.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  async twitterLogin() {
    this.isLoading.set(true);
    this.loginError.set(null);
    try {
      const user = await this.authService.loginWithTwitter();
      console.log('Twitter login succeeded, UID:', user.uid);
      await this.navigateAfterLogin();
      setTimeout(() => {
        if (!this.isLoading()) {
          this.loginError.set('Login successful! Please close the Twitter popup if it remains open.');
        }
      }, 1000);
    } catch (error: any) {
      console.error('Twitter login error:', error);
      this.loginError.set(this.getErrorMessage(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async navigateAfterLogin() {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
    try {
      await this.router.navigate([returnUrl]);
    } catch (navError) {
      console.error('Navigation error:', navError);
      this.loginError.set('Login succeeded, but navigation failed. Please go to the dashboard manually.');
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'auth/popup-closed-by-user':
        return 'Login cancelled by closing the popup';
      case 'auth/popup-blocked':
        return 'Popup blocked. Please allow popups and try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with a different sign-in method';
      default:
        return 'An error occurred during login';
    }
  }
}

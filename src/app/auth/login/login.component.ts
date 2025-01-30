import { Component, OnInit } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { FormBuilder, Validators, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import {AuthService} from "../../shared/services/auth.service";
import {GoogleAuthProvider, TwitterAuthProvider, GithubAuthProvider, FacebookAuthProvider} from "@angular/fire/auth";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule,RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  public newUser = false;
  public loginForm: FormGroup;
  protected loginFailed = false;

  constructor(
      private auth: AuthService,
      private fb: FormBuilder,
      public router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async login() {
    try {
      const success = await this.auth.loginWithEmail(
          this.loginForm.value['email'],
          this.loginForm.value['password']
      );
      this.loginFailed = !success;
    } catch (error) {
      console.error('Login error:', error);
      this.loginFailed = true;
    }
  }

  async googleLogin() {
    try {
      console.log('Starting Google login flow...');
      await this.auth.signInWithGoogle();
      // Note: We won't reach this point due to redirect
    } catch (error: any) {
      console.error('Google login error:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack
      });
      this.loginFailed = true;
    }
  }

  async facebookLogin() {
    try {
      await this.auth.signInWithRedirect(new FacebookAuthProvider());
    } catch (error) {
      console.error('Facebook login failed:', error);
      this.loginFailed = true;
    }
  }

  async twitterLogin() {
    try {
      await this.auth.signInWithRedirect(new TwitterAuthProvider());
    } catch (error) {
      console.error('Twitter login failed:', error);
      this.loginFailed = true;
    }
  }

  async githubLogin() {
    try {
      await this.auth.signInWithRedirect(new GithubAuthProvider());
    } catch (error) {
      console.error('Github login failed:', error);
      this.loginFailed = true;
    }
  }

  ngOnInit(): void {
  }
}

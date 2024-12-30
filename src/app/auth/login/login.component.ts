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
  // public user: firebase.User;
  public loginForm: FormGroup;
  protected loginFailed = false

  public errorMessage: any;

  constructor(private auth : AuthService, private fb: FormBuilder, public router: Router) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
    });
  }

  ngOnInit() {}

  async login() {
     await this.auth.loginWithEmail(this.loginForm.value['email'], this.loginForm.value['password'])
  }

  async logout() {
    await this.auth.logout()
  }

  async twitterLogin() {
    await this.auth.signInWithPopup(new TwitterAuthProvider())
  }

  async facebookLogin() {
    await this.auth.signInWithPopup(new FacebookAuthProvider())
  }

  async githubLogin() {
    await this.auth.signInWithPopup(new GithubAuthProvider())
  }
  async googleLogin(){
    await this.auth.signInWithPopup(new GoogleAuthProvider())
  }
}

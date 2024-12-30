import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {AuthService} from "../../shared/services/auth.service";
import {NgbDatepicker, NgbInputDatepicker} from "@ng-bootstrap/ng-bootstrap";
import {Router, RouterLink} from "@angular/router";
import {GoogleAuthProvider, TwitterAuthProvider, GithubAuthProvider, FacebookAuthProvider} from "@angular/fire/auth";


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbDatepicker, NgbInputDatepicker, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})

export class RegisterComponent implements OnInit {
  protected minAge = 18
  protected registerForm : FormGroup
  protected date = new Date()
  constructor(private auth : AuthService, private fb: FormBuilder, private router : Router) {
    this.registerForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required, Validators.min(8)],
      repassword: ["", Validators.required],
      date: ["", Validators.required]
    });

  }

  ngOnInit() { }

  async register() {
    await this.auth.register(this.registerForm.value['email'], this.registerForm.value['password'])
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

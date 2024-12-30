import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {AuthService} from "../../shared/services/auth.service";

@Component({
  selector: 'app-forget-pwd',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forget-pwd.component.html',
  styleUrls: ['./forget-pwd.component.scss']
})
export class ForgetPwdComponent implements OnInit {
  resetForm : FormGroup
  constructor(private auth : AuthService, private fb : FormBuilder) {
    this.resetForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]]
    });
  }

  ngOnInit() { }

  async sendEmail() {
    await this.auth.recoverAccount(this.resetForm.value)
  }
}

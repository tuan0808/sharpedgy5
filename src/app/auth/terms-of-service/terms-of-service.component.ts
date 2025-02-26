import {Component, signal} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [],
  templateUrl: './terms-of-service.component.html',
  styleUrl: './terms-of-service.component.scss'
})
export class TermsOfServiceComponent {
  termsForm: FormGroup;
  isLoading = signal(false);

  constructor(
      private fb: FormBuilder,
      private router: Router
  ) {
    this.termsForm = this.fb.group({
      agreeTerms: [false, [Validators.requiredTrue]]
    });
  }

  acceptTerms(): void {
    if (this.termsForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.termsForm.controls).forEach(key => {
        const control = this.termsForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);

    // Here you would typically make an API call to record the user's acceptance
    // For demonstration, we'll use a timeout to simulate the API call
    setTimeout(() => {
      // Store acceptance in local storage or other client-side storage
      localStorage.setItem('termsAccepted', 'true');

      // Navigate to the main app or dashboard
      this.router.navigate(['/dashboard']);

      this.isLoading.set(false);
    }, 1000);
  }
}

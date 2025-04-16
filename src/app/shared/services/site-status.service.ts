import {computed, inject, Injectable, signal} from '@angular/core';
import {firstValueFrom} from "rxjs";
import {AngularFireAuth} from "@angular/fire/compat/auth";
import {Auth, signInAnonymously, signOut} from "@angular/fire/auth";
import firebase from "firebase/compat";
import auth = firebase.auth;

@Injectable({
  providedIn: 'root'
})
export class SiteStatusService {
  private auth : Auth = inject(Auth)
// Signals for API status
  private externalApiDown = signal<boolean>(false); // Firebase Authentication status
  private internalApiDown = signal<boolean>(false); // Your internal API status

  // Public signals for consumption
  externalApiDownSig = this.externalApiDown.asReadonly();
  internalApiDownSig = this.internalApiDown.asReadonly();

  // Computed signal for full outage
  isSiteFullyDown = computed(() => this.externalApiDown() && this.internalApiDown());

  constructor() {
    // Check Firebase status on initialization
    this.checkFirebaseStatus();
  }

  // Method to check Firebase Authentication status
  async checkFirebaseStatus(): Promise<void> {
    try {
      // Attempt an anonymous sign-in to test Firebase Auth availability
      const userCredential = await signInAnonymously(auth);

      // If successful, Firebase is up
      this.setExternalApiDown(false);

      // Sign out to avoid persistent anonymous sessions
      await signOut(auth);
    } catch (error) {
      // If the request fails, assume Firebase Auth is down
      console.error('Firebase Authentication check failed:', error);
      this.setExternalApiDown(true);
    }
  }

  // Methods to update signals
  setExternalApiDown(status: boolean): void {
    this.externalApiDown.set(status);
  }

  setInternalApiDown(status: boolean): void {
    this.internalApiDown.set(status);
  }

  // Method to manually trigger a status refresh
  refreshStatus(): void {
    this.checkFirebaseStatus();
    // Add internal API check logic here if applicable
  }
}

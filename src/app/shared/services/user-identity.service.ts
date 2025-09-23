import {computed, inject, Injectable} from '@angular/core';
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class UserIdentityService {
  private readonly authService = inject(AuthService);

  // Computed from AuthService public methods
  public readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  /**
   * Wait for user to be authenticated - returns only the UUID
   */
  public async waitForUser(timeoutMs: number = 10000, maxRetries: number = 3): Promise<string> {
    try {
      await this.authService.ensureAuthInitialized();

      const startTime = Date.now();
      let attempts = 0;

      while (attempts < maxRetries) {
        const userId = await this.authService.getUID(); // Use existing method
        if (userId) {
          return userId;
        }

        if (Date.now() - startTime > timeoutMs) {
          throw new Error('Timeout waiting for user authentication');
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      throw new Error('Failed to authenticate user after maximum retries');
    } catch (error) {
      console.error('Failed to wait for user:', error);
      throw error;
    }
  }

  /**
   * Get current user ID asynchronously (always fresh)
   */
  public async getCurrentUserId(): Promise<string | null> {
    return this.authService.getUID();
  }

  /**
   * Check authentication status
   */
  public isUserAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Get fresh JWT token for API calls (if needed)
   */
  public async getToken(forceRefresh = false): Promise<string | null> {
    return this.authService.getFreshToken(forceRefresh);
  }

  /**
   * Check if user has admin privileges (business logic, not PII)
   */
  public isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /**
   * Get notifications for the current user
   */
  public async getNotifications(): Promise<any[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }

    // You'll need to inject your notification service here
    // For now, returning empty array as placeholder
    console.log('Getting notifications for user:', userId);
    return [];
  }
}

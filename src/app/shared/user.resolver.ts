import {ResolveFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthService} from "./services/auth.service";
import {BetSettlementService} from "./services/betSettlement.service";
import {firstValueFrom} from "rxjs";
import {Account} from "./model/paper-betting/Account";

  export const betSettlementResolver: ResolveFn<Account> = async (route, state) => {
    const auth = inject(AuthService);
    const betSettlement = inject(BetSettlementService);
    const router = inject(Router);

    try {
      // Step 1: Wait for auth check to complete using the public signal
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds with 100ms intervals

      while (!auth.isAuthenticated() && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!auth.isAuthenticated()) {
        console.error('Authentication timeout');
        router.navigate(['/login']);
        return null;
      }

      // Step 2: Get UID using the public method
      const uid = await auth.getUID();
      if (!uid) {
        console.error('User not authenticated');
        router.navigate(['/login']);
        return null;
      }

      // Step 3: Load account with timeout
      const accountPromise = firstValueFrom(betSettlement.getAccount(uid));
      const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Account load timeout')), 5000)
      );

      const account = await Promise.race([accountPromise, timeoutPromise]) as Account;
      if (!account) {
        console.error('Failed to load account');
        router.navigate(['/error']);
        return null;
      }

      return account;
    } catch (error) {
      console.error('Resolver error:', error);
      router.navigate(['/error']);
      return null;
    }
  };

// import {Injectable, Signal, signal} from '@angular/core';
// import {AuthService} from "./auth.service";
// import {Observable, Subject, takeUntil} from "rxjs";
// import {HttpClient, HttpHeaders} from "@angular/common/http";
// import {BetSettlementService} from "./betSettlement.service";
// import {BalanceWebhookResponse} from "../model/paper-betting/BalanceWebhookResponse";
// import {environment} from "../../../environments/environment";
//
// @Injectable({
//   providedIn: 'root'
// })
// export class WebhookService {
//   private readonly baseUrl = 'http://localhost:8080/webhooks/v1';
//   private destroySubject = new Subject<void>();
//   private webhookSecret: string;
//
//   constructor(
//       private auth: AuthService,
//       private http: HttpClient,
//       private betSettlementService: BetSettlementService
//   ) {
//     this.initializeWebhook();
//   }
//
//   private async initializeWebhook() {
//     this.webhookSecret = await this.getWebhookSecret();
//
//     const headers = new HttpHeaders()
//         .set('X-Webhook-Secret', this.webhookSecret)
//         .set('Content-Type', 'application/json');
//
//     this.http.post<BalanceWebhookResponse>(
//         `${this.baseUrl}/balance`,
//         {
//           userId: await this.auth.getUID(),
//           timestamp: new Date().toISOString()
//         },
//         { headers }
//     ).pipe(
//         takeUntil(this.destroySubject)
//     ).subscribe({
//       next: (response) => {
//         // Update the balance directly in BetSettlementService
//         this.betSettlementService.updateBalance(response.balance);
//       },
//       error: (error) => console.error('Balance webhook error:', error)
//     });
//   }
//
//   private async getWebhookSecret(): Promise<string> {
//     return environment['WEBHOOK_SECRET'] || '';
//   }
//
//   public disconnect() {
//     this.destroySubject.next();
//     this.destroySubject.complete();
//   }
//
//   ngOnDestroy() {
//     this.disconnect();
//   }
// }
//
//
//

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DtoCreatePaymentIntent, IPatronSubscription, PurchaseableType } from '@core/interfaces';

@Injectable({ providedIn: 'root' })
export class PatronageService {
  constructor(private http: HttpClient) {}

  // router.post <IPatronSubscription> ("/patron-tiers/:tid/subscribe", Patronage.subscribe());
  subscribe(tierId: string, data: DtoCreatePaymentIntent<PurchaseableType.PatronTier>): Promise<IPatronSubscription> {
    return this.http.post<IPatronSubscription>(`/api/patron-tiers/${tierId}/subscribe`, data).toPromise();
  }

  // router.delete <void> ("/patron-tiers/:tid/unsubscribe", patronage.unsubscribe_user());
  unsubscribe(tierId: string): Promise<void> {
    return this.http.delete<void>(`/api/patron-tiers/${tierId}/unsubscribe`, {}).toPromise();
  }
}

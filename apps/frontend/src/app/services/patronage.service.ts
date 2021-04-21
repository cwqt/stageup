import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IPatronSubscription } from '@core/interfaces';

@Injectable({ providedIn: 'root' })
export class PatronageService {
  constructor(private http: HttpClient) {}

  // router.post <IPatronSubscription> ("/hosts/:hid/patron-tiers/:tid/subscribe", Patronage.subscribeToPatronTier());
  subscribeToPatronTier(hostId: string, tierId: string): Promise<IPatronSubscription> {
    return this.http.post<IPatronSubscription>(`/api/hosts/${hostId}/patron-tiers/${tierId}/subscribe`, {}).toPromise();
  }
}

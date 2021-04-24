import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEnvelopedData, IHostOnboarding, IOnboardingReview } from '@core/interfaces';
import { IQueryParams, querize } from '@core/helpers';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  readOnboardingProcesses(query?: IQueryParams): Promise<IEnvelopedData<IHostOnboarding[]>> {
    return this.http.get<IEnvelopedData<IHostOnboarding[]>>(`/api/admin/onboardings${querize(query)}`).toPromise();
  }

  enactOnboardingProcess(onboardingId: string): Promise<void> {
    return this.http.post<void>(`/api/admin/onboardings/${onboardingId}/enact`, null).toPromise();
  }

  // router.post <void> (`/admin/onboarding/:oid/review`, Admin.reviewOnboarding());
  reviewOnboarding(onboardingId: string, review: IOnboardingReview['steps']): Promise<void> {
    return this.http.post<void>(`/api/admin/onboardings/${onboardingId}/review`, review).toPromise();
  }
}

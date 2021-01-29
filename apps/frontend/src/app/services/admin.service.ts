import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEnvelopedData, IHostOnboarding, IOnboardingStepMap } from '@eventi/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  readOnboardingProcesses(page: number = 0, perPage: number = 10): Promise<IEnvelopedData<IHostOnboarding[], void>> {
    return this.http
      .get<IEnvelopedData<IHostOnboarding[], void>>(`/api/admin/onboarding?page=${page}&per_page=${perPage}`)
      .toPromise();
  }

  enactOnboardingProcess(hostId: number): Promise<void> {
    return this.http.post<void>(`/api/admin/onboarding/${hostId}/enact`, null).toPromise();
  }
}

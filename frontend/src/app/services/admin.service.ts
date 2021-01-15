import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEnvelopedData, IHostOnboarding, IHostOnboardingProcess } from '@eventi/interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) { }

  readOnboardingProcesses(): Promise<IEnvelopedData<IHostOnboarding[], void>> {
    return this.http.get<IEnvelopedData<IHostOnboarding[], void>>('/api/admin/onboarding').toPromise();
  }
}

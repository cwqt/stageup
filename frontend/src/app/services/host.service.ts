import { Injectable } from '@angular/core';
import {
  HostPermission,
  IHostOnboarding,
  IOnboardingStep as IOnboardingStep,
  IUserHostInfo,
  HostOnboardingStep,
} from '@eventi/interfaces';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { IHost, IHostStub } from '@eventi/interfaces';
import { MyselfService } from './myself.service';

@Injectable({
  providedIn: 'root',
})
export class HostService {
  private $currentHost: BehaviorSubject<IHostStub> = new BehaviorSubject(null);
  private $currentUserHostInfo: BehaviorSubject<IUserHostInfo> = new BehaviorSubject(null);

  public get hostId() {
    return this.$currentHost.value._id;
  }
  public get userHostPermission(): HostPermission {
    return this.$currentUserHostInfo.value.permissions;
  }
  public get currentHostValue() {
    return this.$currentHost.value;
  }
  public get currentUserHostInfoValue() {
    return this.$currentUserHostInfo.value;
  }

  constructor(private http: HttpClient, private myselfService: MyselfService) {
    this.myselfService.$myself.subscribe(m => {
      this.$currentHost.next(m?.host);
      this.$currentUserHostInfo.next(m?.host_info);
    });
  }

  getUserHostInfo(hostId: number, userId: number): Promise<IUserHostInfo> {
    return this.http
      .get<IUserHostInfo>(`/api/hosts/${hostId}/permissions?user=${userId}`)
      .pipe(tap(hi => this.myselfService.setUserHostInfo(hi)))
      .toPromise();
  }

  createHost(data: Pick<IHost, 'name' | 'username'>): Promise<IHost> {
    return this.http
      .post<IHost>('/api/hosts', data)
      .pipe(tap(d => this.myselfService.setHost(d)))
      .toPromise();
  }

  getHost(hostId: number): Promise<IHost> {
    return this.http.get<IHost>(`/api/hosts/${hostId}`).toPromise();
  }

  // router.get <IHOnboarding> ("/hosts/:hid/onboarding/status", Hosts.readOnboardingProcessStatus());
  readOnboardingProcessStatus(hostId: number): Promise<IHostOnboarding> {
    return this.http.get<IHostOnboarding>(`/api/hosts/${hostId}/onboarding/status`).toPromise();
  }

  // router.post<void> ("/hosts/:hid/onboarding/submit", Hosts.submitOnboardingProcess());
  submitOnboardingProcess(hostId: number): Promise<void> {
    return this.http.post<void>(`/api/hosts/${hostId}/onboarding/submit`, {}).toPromise();
  }

  // router.get <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.readOnboardingProcessStep());
  readOnboardingProcessStep(hostId: number, step: HostOnboardingStep): Promise<IOnboardingStep<any>> {
    return this.http.get<IOnboardingStep<any>>(`/api/host/${hostId}/onboarding/${step}`).toPromise();
  }

  // router.put <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.updateOnboardingProcessStep());
  updateOnboardingProcessStep(hostId: number, step: HostOnboardingStep, update: any): Promise<IOnboardingStep<any>> {
    return this.http.put<IOnboardingStep<any>>(`/api/hosts/${hostId}/onboarding/${step}`, update).toPromise();
  }
}

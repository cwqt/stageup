import { Host, Injectable } from '@angular/core';
import {
  HostPermission,
  IHostOnboarding,
  IOnboardingStep as IOnboardingStep,
  IUserHostInfo,
  HostOnboardingStep,
  IOnboardingStepMap,
  IPerformanceStub,
  IPerformance,
  DtoCreatePerformance,
  IHostMemberChangeRequest,
  IEnvelopedData,
  IHostStripeInfo
} from '@core/interfaces';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { IHost, IHostStub } from '@core/interfaces';
import { MyselfService } from './myself.service';
import fd from 'form-data';
import { timestamp } from '@core/shared/helpers';

@Injectable({
  providedIn: 'root'
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

  readUserHostInfo(hostId: string, userId: string): Promise<IUserHostInfo> {
    return this.http
      .get<IUserHostInfo>(`/api/hosts/${hostId}/permissions?user=${userId}`)
      .pipe(tap(hi => this.myselfService.setUserHostInfo(hi)))
      .toPromise();
  }

  createHost(data: Pick<IHost, 'name' | 'username'>): Promise<IHost> {
    return this.http
      .post<IHost>('/api/hosts', data)
      .pipe(
        tap(d =>
          this.myselfService.store({
            user: this.myselfService.$myself.getValue().user,
            // propagate both the new host, and the host creators (owner)
            // permissions to the other services
            host: d,
            host_info: {
              permissions: HostPermission.Owner,
              joined_at: timestamp(),
              prefers_dashboard_landing: true
            }
          }, true)
        )
      )
      .toPromise();
  }

  readHost(hostId: string): Promise<IHost> {
    return this.http.get<IHost>(`/api/hosts/${hostId}`).toPromise();
  }

  // router.get <IHOnboarding> ("/hosts/:hid/onboarding/status", Hosts.readOnboardingProcessStatus());
  readOnboardingProcessStatus(hostId: string): Promise<IHostOnboarding> {
    return this.http.get<IHostOnboarding>(`/api/hosts/${hostId}/onboarding/status`).toPromise();
  }

  // router.post<void> ("/hosts/:hid/onboarding/submit", Hosts.submitOnboardingProcess());
  submitOnboardingProcess(hostId: string): Promise<void> {
    return this.http.post<void>(`/api/hosts/${hostId}/onboarding/submit`, {}).toPromise();
  }

  // router.get <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.readOnboardingProcessStep());
  readOnboardingProcessStep(hostId: string, step: HostOnboardingStep): Promise<IOnboardingStep<any>> {
    return this.http.get<IOnboardingStep<any>>(`/api/hosts/${hostId}/onboarding/${step}`).toPromise();
  }

  // router.put <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.updateOnboardingProcessStep());
  updateOnboardingProcessStep(hostId: string, step: HostOnboardingStep, update: any): Promise<IOnboardingStep<any>> {
    return this.http.put<IOnboardingStep<any>>(`/api/hosts/${hostId}/onboarding/${step}`, update).toPromise();
  }

  readOnboardingSteps(hostId: string): Promise<IOnboardingStepMap> {
    return this.http.get<IOnboardingStepMap>(`/api/hosts/${hostId}/onboarding/steps`).toPromise();
  }

  // router.post <IPerf> ("/hosts/:hid/performances", Perfs.createPerformance());
  createPerformance(hostId: string, data: DtoCreatePerformance): Promise<IPerformance> {
    return this.http.post<IPerformance>(`/api/hosts/${hostId}/performances`, data).toPromise();
  }

  // router.get <IHost> ("/hosts/@:username", Hosts.readHostByUsername());
  readHostByUsername(hostUsername: string): Promise<IHost> {
    return this.http.get<IHost>(`/api/hosts/@${hostUsername}`).toPromise();
  }

  // router.get <IUserStub[]> ("/hosts/:hid/members", Hosts.readMembers());
  readMembers(hostId: string): Promise<IEnvelopedData<IUserHostInfo[]>> {
    return this.http.get<IEnvelopedData<IUserHostInfo[], null>>(`/api/hosts/${hostId}/members`).toPromise();
  }

  addMember(hostId: string, addition: IHostMemberChangeRequest): Promise<IUserHostInfo> {
    return this.http.post<IUserHostInfo>(`/api/hosts/${hostId}/members`, addition).toPromise();
  }

  //router.get <IE<IPerformance[], null>> ("/hosts/:hid/performances", Hosts.readHostPerformances());
  readHostPerformances(
    hostId: string,
    page: number = 0,
    perPage: number = 10
  ): Promise<IEnvelopedData<IPerformanceStub[], null>> {
    return this.http
      .get<IEnvelopedData<IPerformanceStub[], null>>(
        `/api/hosts/${hostId}/performances?page=${page}&per_page=${perPage}`
      )
      .toPromise();
  }

  //router.get <void> ("/hosts/:hid/performances/:pid/provision", Hosts.provisionPerformanceAccessTokens());
  provisionPerformanceAccessTokens(hostId: string, performanceId: string, emailAddresses: string[]): Promise<void> {
    return this.http
      .post<void>(`/api/hosts/${hostId}/performances/${performanceId}/provision`, { email_addresses: emailAddresses })
      .toPromise();
  }

  connectStripe(hostId:string):Promise<string> {
    return this.http.post<string>(`/api/hosts/${hostId}/stripe/connect`, null).toPromise();
  }
  
  //router.put <void> ("/hosts/:hid/members/:mid", Hosts.updateMember());
  updateMember(hostId: string, userId: string, permissions: HostPermission): Promise<void> {
    return this.http
      .put<void>(`/api/hosts/${hostId}/members/${userId}`, { value: permissions })
      .toPromise();
  }

  changeAvatar(hostId: string, data: fd | null) {
    return this.http.put<IHostStub>(`api/hosts/${hostId}/avatar`, data).toPromise();
  }

  // router.get <IHostStripeInfo> ("/hosts/:hid/stripe/info", Hosts.readStripeInfo());
  readStripeInfo(hostId:string):Promise<IHostStripeInfo> {
    return this.http.get<IHostStripeInfo>(`/api/hosts/${hostId}/stripe/info`).toPromise();
  }

  //router.put  <IHostS> ("/hosts/:hid/banner", Hosts.changeBanner());
  changeBanner(hostId: string, data: fd | null) {
    return this.http.put<IHostStub>(`api/hosts/${hostId}/banner`, data).toPromise();
  } 
}

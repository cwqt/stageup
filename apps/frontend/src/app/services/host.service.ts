import { Injectable } from '@angular/core';
import {
  AssetType,
  DtoUserMarketingInfo,
  ExportFileType,
  HostPermission,
  IHostOnboarding,
  IOnboardingStep as IOnboardingStep,
  IUserHostInfo,
  HostOnboardingStep,
  IOnboardingStepMap,
  IFollower,
  IPerformanceStub,
  IPerformance,
  DtoCreatePerformance,
  IHostMemberChangeRequest,
  IEnvelopedData,
  IHostStripeInfo,
  IHostInvoice,
  IHostPrivate,
  DtoCreatePatronTier,
  IPatronTier,
  IHostInvoiceStub,
  IRefund,
  IInvoice,
  IClientHostData,
  DtoHostPatronageSubscription,
  IDeleteHostAssertion,
  IDeleteHostReason,
  DtoUpdateHost,
  IHostPatronTier,
  DtoUpdatePatronTier,
  IBulkRefund,
  DtoPerformanceAnalytics,
  AnalyticsTimePeriod,
  DtoHostAnalytics,
  IUserMarketingInfo,
  IFeedPerformanceStub,
  IHostFeed,
  PaginationOptions,
  NUUID,
  ILike,
  LikeLocation,
  DtoReadHost
} from '@core/interfaces';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { IHost, IHostStub } from '@core/interfaces';
import { MyselfService } from './myself.service';
import fd from 'form-data';
import { IQueryParams, querize, timestamp } from '@core/helpers';

@Injectable({
  providedIn: 'root'
})
export class HostService {
  private $currentHost: BehaviorSubject<IHost> = new BehaviorSubject(null);
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

  createHost(data: Pick<IHostPrivate, 'name' | 'username' | 'email_address'>): Promise<IHost> {
    return this.http
      .post<IHost>('/api/hosts', data)
      .pipe(
        tap(d =>
          this.myselfService.store(
            {
              user: this.myselfService.$myself.getValue().user,
              // propagate both the new host, and the host creators (owner)
              // permissions to the other services
              host: d,
              host_info: {
                permissions: HostPermission.Owner,
                joined_at: timestamp(),
                prefers_dashboard_landing: true
              }
            },
            true
          )
        )
      )
      .toPromise();
  }

  readHost(hostId: string): Promise<DtoReadHost> {
    return this.http.get<DtoReadHost>(`/api/hosts/${hostId}`).toPromise();
  }

  // router.put <IHostPrivate> ("/hosts/:hid", Hosts.updateHost());
  updateHost(hostId: string, body: DtoUpdateHost): Promise<IHostPrivate> {
    return this.http.put<IHostPrivate>(`/api/hosts/${hostId}`, body).toPromise();
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
  readHostByUsername(hostUsername: string): Promise<DtoReadHost> {
    return this.http.get<DtoReadHost>(`/api/hosts/@${hostUsername}`).toPromise();
  }

  // // router.get <IUserStub[]> ("/hosts/:hid/members", Hosts.readMembers());
  // readMembers(hostId: string): Promise<IEnvelopedData<IUserHostInfo[]>> {
  //   return this.http.get<IEnvelopedData<IUserHostInfo[], null>>(`/api/hosts/${hostId}/members`).toPromise();
  // }

  // router.get <IUserStub[]> ("/hosts/:hid/members", Hosts.readMembers());
  readMembers(hostId: string, query: IQueryParams): Promise<IEnvelopedData<IUserHostInfo[]>> {
    return this.http
      .get<IEnvelopedData<IUserHostInfo[], null>>(`/api/hosts/${hostId}/members${querize(query)}`)
      .toPromise();
  }

  addMember(hostId: string, addition: IHostMemberChangeRequest): Promise<IUserHostInfo> {
    return this.http.post<IUserHostInfo>(`/api/hosts/${hostId}/members`, addition).toPromise();
  }

  //router.get <IE<IPerformance[], null>> ("/hosts/:hid/performances", Hosts.readHostPerformances());
  readHostPerformances(hostId: string, query: IQueryParams): Promise<IEnvelopedData<IPerformanceStub[], null>> {
    return this.http
      .get<IEnvelopedData<IPerformanceStub[], null>>(`/api/hosts/${hostId}/performances${querize(query)}`)
      .toPromise();
  }

  readHostFeed(
    hostId: string,
    paging: { [index in keyof IHostFeed]?: PaginationOptions }
  ): Promise<IEnvelopedData<IFeedPerformanceStub[], null>> {
    return this.http
      .get<IEnvelopedData<IFeedPerformanceStub[], null>>(`/api/hosts/${hostId}/feed${querize(paging)}`)
      .toPromise();
  }

  // router.delete   <void> ("/hosts/:hid/members/:uid", Hosts.removeMember());
  removeMember(hostId: string, userId: string): Promise<void> {
    return this.http
      .delete<void>(`/api/hosts/${hostId}/members/${userId}`)
      .toPromise()
      .then(() => {
        this.myselfService.setHost(null);
        this.myselfService.setUserHostInfo(null);
      });
  }

  //router.get <void> ("/hosts/:hid/performances/:pid/provision", Hosts.provisionPerformanceAccessTokens());
  provisionPerformanceAccessTokens(hostId: string, performanceId: string, emailAddresses: string[]): Promise<void> {
    return this.http
      .post<void>(`/api/hosts/${hostId}/performances/${performanceId}/provision`, { email_addresses: emailAddresses })
      .toPromise();
  }

  connectStripe(hostId: string): Promise<string> {
    return this.http.post<string>(`/api/hosts/${hostId}/stripe/connect`, null).toPromise();
  }

  //router.put <void> ("/hosts/:hid/members/:mid", Hosts.updateMember());
  updateMember(hostId: string, userId: string, permissions: HostPermission): Promise<void> {
    return this.http
      .put<void>(`/api/hosts/${hostId}/members/${userId}`, { value: permissions })
      .toPromise();
  }

  changeAvatar(hostId: string, data: FormData | null): Promise<string> {
    return this.http.put<string>(`/api/hosts/${hostId}/avatar`, data).toPromise();
  }

  // router.get <IHostStripeInfo> ("/hosts/:hid/stripe/info", Hosts.readStripeInfo());
  readStripeInfo(hostId: string): Promise<IHostStripeInfo> {
    return this.http.get<IHostStripeInfo>(`/api/hosts/${hostId}/stripe/info`).toPromise();
  }

  //router.put  <IHostStub> ("/hosts/:hid/banner", Hosts.changeBanner());
  changeBanner(hostId: string, data: FormData | null): Promise<string> {
    return this.http.put<string>(`/api/hosts/${hostId}/banner`, data).toPromise();
  }

  // router.get <IE<IHostInvoiceStub[]>> ("/hosts/:hid/invoices", Hosts.readInvoices());
  readInvoices(hostId: string, query: IQueryParams): Promise<IEnvelopedData<IHostInvoiceStub[]>> {
    return this.http
      .get<IEnvelopedData<IHostInvoiceStub[]>>(`/api/hosts/${hostId}/invoices${querize(query)}`)
      .toPromise();
  }

  //router.get<IHostInvoice>("/hosts/:hid/invoices/:iid",Hosts.readInvoice());
  readInvoice(hostId: string, invoiceId: string): Promise<IHostInvoice> {
    return this.http.get<IHostInvoice>(`/api/hosts/${hostId}/invoices/${invoiceId}`).toPromise();
  }

  //router.post<void>("/hosts/:hid/invoices/process-refunds", Hosts.processRefund());
  processRefunds(invoiceIds: string[], hostId: string, bulkRefund?: IBulkRefund): Promise<void> {
    return this.http
      .post<void>(`/api/hosts/${hostId}/invoices/process-refunds`, {
        invoice_ids: invoiceIds,
        bulk_refund_reason: bulkRefund.bulk_refund_reason,
        bulk_refund_detail: bulkRefund.bulk_refund_detail
      })
      .toPromise();
  }

  //router.post <void> ("/hosts/:hid/invoices/export/:type", Hosts.exportInvoices());
  exportInvoices(hostId: string, invoices: Array<IInvoice['_id']>, type: ExportFileType): Promise<void> {
    return this.http
      .post<void>(`/api/hosts/${hostId}/invoices/export/${type}`, { invoices: invoices })
      .toPromise();
  }

  // router.post <IHostPatronTier> ("/hosts/:hid/patron-tiers", Hosts.createPatronTier());
  createPatronTier(hostId: string, data: DtoCreatePatronTier): Promise<IHostPatronTier> {
    return this.http.post<IHostPatronTier>(`/api/hosts/${hostId}/patron-tiers`, data).toPromise();
  }

  // router.get <IPatronTier[]> ("/hosts/:hid/patron-tiers", Hosts.readPatronTiers());
  readPatronTiers(hostId: string): Promise<IPatronTier[]> {
    return this.http.get<IPatronTier[]>(`/api/hosts/${hostId}/patron-tiers`).toPromise();
  }

  // router.put <IHostPatronTier> ("/hosts/:hid/patron-tiers/:tid", Patronage.updatePatronTier());
  updatePatronTier(hostId: string, tierId: string, update: DtoUpdatePatronTier): Promise<IHostPatronTier> {
    return this.http.put<IHostPatronTier>(`/api/hosts/${hostId}/patron-tiers/${tierId}`, update).toPromise();
  }

  // router.delete <void> ("/hosts/:hid/patron-tiers/:tid", Hosts.deletePatronTier());
  deletePatronTier(hostId: string, tierId: string): Promise<void> {
    return this.http.delete<void>(`/api/hosts/${hostId}/patron-tiers/${tierId}`).toPromise();
  }

  // router.get<IRefund[]>('/hosts/:hid/invoices/:iid/refunds',Hosts.readInvoiceRefunds());
  readInvoiceRefunds(hostId: string, invoiceId: string): Promise<IRefund[]> {
    return this.http.get<IRefund[]>(`/api/hosts/${hostId}/invoices/${invoiceId}/refunds`).toPromise();
  }

  // router.get <IE<HPatronSub[]>> ("/hosts/:hid/patronage/subscribers", Hosts.readPatronageSubscribers());
  readPatronageSubscribers(
    hostId: string,
    query: IQueryParams
  ): Promise<IEnvelopedData<DtoHostPatronageSubscription[]>> {
    return this.http
      .get<IEnvelopedData<DtoHostPatronageSubscription[]>>(
        `/api/hosts/${hostId}/patronage/subscribers${querize(query)}`
      )
      .toPromise();
  }

  // router.delete <IDelHostAssert | void> ("/hosts/:hid", Hosts.deleteHost());
  deleteHost(
    hostId: string,
    reason?: IDeleteHostReason,
    assertOnly: boolean = false
  ): Promise<IDeleteHostAssertion | void> {
    return this.http
      .request<IDeleteHostAssertion | void>('delete', `/api/hosts/${hostId}?assert_only=${assertOnly}`, {
        body: reason
      })
      .toPromise();
  }

  //router.get <IHostPrivate> ("/hosts/:hid/details", Hosts.readDetails());
  readDetails(hostId: string): Promise<IHostPrivate> {
    return this.http.get<IHostPrivate>(`/api/hosts/${hostId}/details`).toPromise();
  }

  //router.get <IEnvelopedData<IFollower[], null>> ("/hosts/:hid/followers", Hosts.readHostFollowers());
  readHostFollowers(hostId: string): Promise<IEnvelopedData<IFollower[]>> {
    return this.http.get<IEnvelopedData<IFollower[]>>(`/api/hosts/${hostId}/followers`).toPromise();
  }

  // router.get <IE<DtoPerfAnalytics[]>>("/hosts/:hid/analytics/performances", Hosts.readPerformancesAnalytics());
  readPerformancesAnalytics(
    hostId: string,
    period: AnalyticsTimePeriod = 'WEEKLY',
    query: IQueryParams
  ): Promise<IEnvelopedData<DtoPerformanceAnalytics[]>> {
    return this.http
      .get<IEnvelopedData<DtoPerformanceAnalytics[]>>(
        `/api/hosts/${hostId}/analytics/performances${querize({ ...query, period })}`
      )
      .toPromise();
  }

  // router.post <void> ("/hosts/:hid/toggle-like", Hosts.toggleLike());
  toggleLike(hostId: NUUID): Promise<void> {
    return this.http.post<void>(`/api/hosts/${hostId}/toggle-like`, null).toPromise();
  }

  // router.get <DtoHostAnalytics>  ("/hosts/:hid/analytics", Hosts.readHostAnalytics());
  readHostAnalytics(hostId: string, period: AnalyticsTimePeriod = 'WEEKLY'): Promise<DtoHostAnalytics> {
    return this.http.get<DtoHostAnalytics>(`/api/hosts/${hostId}/analytics?period=${period}`).toPromise();
  }

  // router.get <DtoUserMarketingInfo>  ("/hosts/:hid/marketing/audience", Host.readHostMarketingConsents());
  readHostMarketingConsents(hostId: string, query: IQueryParams): Promise<DtoUserMarketingInfo> {
    return this.http.get<DtoUserMarketingInfo>(`/api/hosts/${hostId}/marketing/audience${querize(query)}`).toPromise();
  }

  // router.post <void> ("/hosts/:hid/marketing/audience/export/:type", Hosts.exportUserMarketing());
  exportUserMarketing(
    hostId: string,
    selectedUsers: Array<IUserMarketingInfo['_id']>,
    type: ExportFileType
  ): Promise<void> {
    return this.http
      .post<void>(`/api/hosts/${hostId}/marketing/audience/export/${type}`, { selected_users: selectedUsers })
      .toPromise();
  }

  // router.put <void> ("/hosts/:hid/commission-rate", Hosts.updateCommissionRate());
  updateCommissionRate(hostId: string, newRate: number): Promise<void> {
    return this.http
      .put<void>(`/api/hosts/${hostId}/commission-rate`, { new_rate: newRate })
      .toPromise();
  }
  // router.put <void> ("/hosts/:hid/assets", Hosts.updateHostAssets());
  updateHostAssets(hostId: string, fd: FormData, type: AssetType, replaces?: string): Promise<void> {
    return this.http.put<void>(`/api/hosts/${hostId}/assets${querize({ type, replaces })}`, fd).toPromise();
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  DtoAddPaymentMethod,
  DtoUserPatronageSubscription,
  HTTP,
  IEnvelopedData,
  IFollowing,
  IHost,
  IHostStub,
  IMyself,
  IPasswordConfirmationResponse,
  IPaymentMethod,
  IPaymentMethodStub,
  IPerformanceStub,
  IRefundRequest,
  IUserHostInfo,
  IUserInvoice,
  LocaleOptions
} from '@core/interfaces';
import { UserHostInfo } from '@core/api';
import { IQueryParams, querize } from '@core/helpers';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LocalStorageKey } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class MyselfService {
  $myself: BehaviorSubject<IMyself | null>;

  constructor(private http: HttpClient, private router: Router) {
    this.$myself = new BehaviorSubject(this.hydrate());
  }

  store(myself: IMyself | null, rehydrate?: boolean) {
    if (myself == null) {
      localStorage.removeItem(LocalStorageKey.Myself);
    } else {
      localStorage.setItem(LocalStorageKey.Myself, JSON.stringify(myself));
    }

    if (rehydrate) this.hydrate(myself);
  }

  /**
   * @description re-hydrate services with a stored myself or new myself
   * @param myself current user ( and host / host info if part of one)
   */
  hydrate(myself?: IMyself): IMyself | null {
    const me: IMyself | null = myself || JSON.parse(localStorage.getItem(LocalStorageKey.Myself));

    // if this is being called from the constructor $myself doesn't exist yet
    // re-fan myself to subscribers every hydration
    this.$myself?.next(me);

    return me;
  }

  getMyself(): Promise<IMyself> {
    return this.http
      .get<IMyself>(`/api/myself`)
      .pipe(
        tap(
          (myself: IMyself) => {
            myself.user.avatar = myself.user.avatar || 'assets/avatar-placeholder.png';
            this.store(this.hydrate(myself));
          },
          (e: HttpErrorResponse) => {
            if (e.status == HTTP.NotFound || e.status == HTTP.Unauthorised) {
              // don't use authService because of circular DI
              this.store(null);
            }
          }
        )
      )
      .toPromise();
  }

  setUser(user: IMyself['user']) {
    this.store({ ...this.$myself.value, user: user }, true);
  }

  setHost(host: IHost) {
    this.store({ ...this.$myself.value, host: host }, true);
  }

  setUserHostInfo(userHostInfo: IUserHostInfo) {
    this.store({ ...this.$myself.value, host_info: userHostInfo });
  }

  setFollowing(following: IFollowing[]) {
    this.store({ ...this.$myself.value, following }, true);
  }

  // router.put <IMyself["host_info"]>  ("/myself/landing-page", Users.updatePreferredLandingPage());
  updatePreferredLandingPage(data: Pick<UserHostInfo, 'prefers_dashboard_landing'>): Promise<IMyself['host_info']> {
    return this.http.put<IMyself['host_info']>('/api/myself/landing-page', data).toPromise();
  }

  updateLocale(body: { locale: LocaleOptions }): Promise<string> {
    return this.http.put<string>('/api/myself/locale', body).toPromise();
  }

  // router.get <IE<IPerfS[]>> ("/myself/purchased-performances", Myself.readMyPurchasedPerformances());
  readMyPurchasedPerformances(name?: string): Promise<IEnvelopedData<IPerformanceStub[]>> {
    return this.http
      .get<IEnvelopedData<IPerformanceStub[]>>(`/api/myself/purchased-performances${name ? `?name=${name}` : ''}`)
      .toPromise();
  }

  //router.get<IUserInvoice>("/myself/invoices/:iid",Myself.readInvoice());
  readInvoice(invoiceId: string) {
    return this.http.get<IUserInvoice>(`/api/myself/invoices/${invoiceId}`).toPromise();
  }

  // router.get <IE<IUserInvoice[]>> ("/myself/invoices", Myself.readInvoices());
  readInvoices(query: IQueryParams): Promise<IEnvelopedData<IUserInvoice[]>> {
    return this.http.get<IEnvelopedData<IUserInvoice[]>>(`/api/myself/invoices${querize(query)}`).toPromise();
  }

  //router.post<void>("/myself/invoices/:iid/request-refund",Myself.requestInvoiceRefund());
  requestInvoiceRefund(invoiceId: string, refundReq: IRefundRequest): Promise<void> {
    return this.http.post<void>(`/api/myself/invoices/${invoiceId}/request-refund`, refundReq).toPromise();
  }
  // router.get <IPaymentMethodStub[]>  ("/myself/payment-methods", Myself.readPaymentMethods());
  readPaymentMethods(): Promise<IPaymentMethodStub[]> {
    return this.http.get<IPaymentMethodStub[]>('/api/myself/payment-methods').toPromise();
  }

  addCreatedPaymentMethod(data: DtoAddPaymentMethod): Promise<IPaymentMethod> {
    return this.http.post<IPaymentMethod>(`/api/myself/payment-methods`, data).toPromise();
  }

  // router.get <IPaymentMethod> ("/myself/payment-methods/:pmid", Myself.readPaymentMethod());
  readPaymentMethod(paymentMethodId: IPaymentMethodStub['_id']): Promise<IPaymentMethodStub[]> {
    return this.http.get<IPaymentMethodStub[]>(`/api/myself/payment-methods/${paymentMethodId}`).toPromise();
  }

  // router.delete <void> ("/myself/payment-methods/:pmid", Myself.deletePaymentMethod());
  deletePaymentMethod(paymentMethodId: IPaymentMethodStub['_id']): Promise<void> {
    return this.http.delete<void>(`/api/myself/payment-methods/${paymentMethodId}`).toPromise();
  }

  // router.put <IPaymentMethod> ("/myself/payment-methods/:pmid", Myself.updatePaymentMethod());
  updatePaymentMethod(paymentMethodId: IPaymentMethodStub['_id'], data): Promise<IPaymentMethod> {
    return this.http.put<IPaymentMethod>(`/api/myself/payment-methods/${paymentMethodId}`, data).toPromise();
  }

  // router.get <IE<UPatronInvoice[]>> ("/myself/patron-subscriptions", Myself.readPatronageSubscriptions());
  readPatronageSubscriptions(query: IQueryParams): Promise<IEnvelopedData<DtoUserPatronageSubscription[]>> {
    return this.http
      .get<IEnvelopedData<DtoUserPatronageSubscription[]>>(`/api/myself/patron-subscriptions${querize(query)}`)
      .toPromise();
  }

  // router.post <IPasswordConfirmRes> ("/myself/confirm-password", Myself.confirmPassword());
  confirmPassword(password: string): Promise<IPasswordConfirmationResponse> {
    return this.http
      .post<IPasswordConfirmationResponse>(`/api/myself/confirm-password`, { password: password })
      .toPromise();
  }

  //router.post <IFollowing> ("/myself/follow-host/:hid", Myself.addFollow());
  followHost(hostId: string): Promise<IFollowing> {
    return this.http
    .post<IFollowing>(`/api/myself/follow-host/${hostId}`, {})
    .toPromise()
  }

  //router.delete <void> ("/myself/unfollow-host/hid", Myself.deleteFollow());
  unfollowHost(hostId: string): Promise<void> {
    return this.http
    .delete<void>(`/api/myself/unfollow-host/${hostId}`)
    .toPromise();
  }
}

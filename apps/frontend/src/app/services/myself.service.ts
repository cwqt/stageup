import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  DtoAddPaymentMethod,
  DtoUserPatronageInvoice,
  HTTP,
  IEnvelopedData,
  IHost,
  IHostStub,
  IMyself,
  IPaymentMethod,
  IPaymentMethodStub,
  IPerformanceStub,
  IRefundRequest,
  IUserHostInfo,
  IUserInvoice
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

  // router.put <IMyself["host_info"]>  ("/myself/landing-page", Users.updatePreferredLandingPage());
  updatePreferredLandingPage(data: Pick<UserHostInfo, 'prefers_dashboard_landing'>): Promise<IMyself['host_info']> {
    return this.http.put<IMyself['host_info']>('/api/myself/landing-page', data).toPromise();
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

  //router.post<void>("/myself/invoices/request-refund",Myself.requestInvoiceRefund());
  requestInvoiceRefund(refundReq: IRefundRequest): Promise<void> {
    return this.http.post<void>(`/api/myself/invoices/request-refund`, refundReq).toPromise();
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
  readPatronageSubscriptions(query: IQueryParams): Promise<IEnvelopedData<DtoUserPatronageInvoice[]>> {
    return this.http
      .get<IEnvelopedData<DtoUserPatronageInvoice[]>>(`/api/myself/patron-subscriptions${querize(query)}`)
      .toPromise();
  }
}

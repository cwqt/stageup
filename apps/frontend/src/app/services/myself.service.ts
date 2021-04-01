import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DtoAccessToken,
  IEnvelopedData,
  IHostStub,
  IMyself,
  IPerformance,
  IPerformanceStub,
  IUserHostInfo,
  IUserInvoice
} from '@core/interfaces';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HTTP } from '@core/interfaces';
import { Router } from '@angular/router';
import { LocalStorageKey } from '../app.interfaces';
import { UserHostInfo } from '@core/shared/api';
import { IQueryParams, querize } from '@core/shared/helpers';

@Injectable({
  providedIn: 'root'
})
export class MyselfService {
  $myself: BehaviorSubject<IMyself | null>;
  $currentlyWatching: BehaviorSubject<IEnvelopedData<IPerformance, DtoAccessToken> | null>;

  constructor(private http: HttpClient, private router: Router) {
    this.$myself = new BehaviorSubject(this.hydrate());
    this.$currentlyWatching = new BehaviorSubject(null);
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

  setHost(host: IHostStub) {
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

  // router.get <IE<IUserInvoice[]>> ("/myself/invoices", Myself.readInvoices());
  readInvoices(query: IQueryParams): Promise<IEnvelopedData<IUserInvoice[]>> {
    return this.http.get<IEnvelopedData<IUserInvoice[]>>(`/api/myself/invoices${querize(query)}`).toPromise();
  }
}

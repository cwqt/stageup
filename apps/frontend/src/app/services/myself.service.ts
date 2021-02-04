import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IHostStub, IMyself, IUser, IUserHostInfo } from '@core/interfaces';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HTTP } from '@core/interfaces';
import { Router } from '@angular/router';

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
      localStorage.removeItem('lastMyself');
    } else {
      localStorage.setItem('lastMyself', JSON.stringify(myself));
    }

    if (rehydrate) this.hydrate(myself);
  }

  /**
   * @description re-hydrate services with a stored myself or new myself
   * @param myself current user ( and host / host info if part of one)
   */
  hydrate(myself?: IMyself): IMyself | null {
    const me: IMyself | null = myself || JSON.parse(localStorage.getItem('lastMyself'));

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
            myself.user.avatar = myself.user.avatar || 'assets/avatar_placeholder.png';
            this.store(this.hydrate(myself));
          },
          (e: HttpErrorResponse) => {
            if (e.status == HTTP.NotFound || e.status == HTTP.Unauthorised) {
              // don't use authService because of circular DI
              this.store(null);
              this.router.navigate(['/']);
            }
          }
        )
      )
      .toPromise();
  }

  setUser(user: IUser) {
    this.store({ ...this.$myself.value, user: user }, true);
  }

  setHost(host: IHostStub) {
    this.store({ ...this.$myself.value, host: host }, true);
  }

  setUserHostInfo(userHostInfo: IUserHostInfo) {
    this.store({ ...this.$myself.value, host_info: userHostInfo });
  }
}

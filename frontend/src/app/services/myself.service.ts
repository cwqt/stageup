import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IHostStub, IMyself, IUser, IUserHostInfo } from "@eventi/interfaces";
import { BehaviorSubject } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class MyselfService {
  $myself: BehaviorSubject<IMyself | null>;

  constructor(
    private http: HttpClient,
  ) {
    this.$myself = new BehaviorSubject(this.hydrate());
  }

  store(myself: IMyself | null, reHydrate?: boolean) {
    if (myself == null) {
      localStorage.removeItem("lastMyself");
    } else {
      localStorage.setItem("lastMyself", JSON.stringify(myself));
    }

    if (reHydrate) this.hydrate(myself, myself == null);
  }

  /**
   * @description re-hydrate services with a stored myself or new myself
   * @param myself current user ( and host / host info if part of one)
   * @param clear remove the current user (e.g. when logging out)
   */
  hydrate(myself?: IMyself, clear?:boolean): IMyself | null {
    const me: IMyself | null =
      myself || JSON.parse(localStorage.getItem("lastMyself"));

    // if this is being called from the constructor $myself doesn't exist yet
    // re-fan myself to subscribers every hydration
    this.$myself?.next(me);

    return me;
  }

  getMyself(): Promise<IMyself> {
    return this.http
      .get<IMyself>(`/api/myself`)
      .pipe(tap((myself) => this.store(this.hydrate(myself))))
      .toPromise();
  }

  setUser(user: IUser) {
    console.log(this.$myself.value, { ...this.$myself.value, user: user })
    this.store({ ...this.$myself.value, user: user }, true);
  }

  setHost(host: IHostStub) {
    this.store({ ...this.$myself.value, host: host }, true);
  }

  setUserHostInfo(userHostInfo:IUserHostInfo) {
    this.store({ ...this.$myself.value, host_info: userHostInfo });
  }
}

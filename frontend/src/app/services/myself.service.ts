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

    if (reHydrate) this.hydrate(myself);
  }

  /**
   * @description re-hydrate services with a stored myself or new myself
   * @param myself current user ( and host / host info if part of one)
   */
  hydrate(myself?: IMyself): IMyself | null {
    const me: IMyself | null = myself || JSON.parse(localStorage.getItem("lastMyself"));

    // if this is being called from the constructor $myself doesn't exist yet
    // re-fan myself to subscribers every hydration
    this.$myself?.next(me);

    return me;
  }

  getMyself(): Promise<IMyself> {
    return this.http
      .get<IMyself>(`/api/myself`)
<<<<<<< HEAD
      .pipe(tap((myself) => this.store(myself, true)))
=======
      .pipe(tap((myself) => this.store(this.hydrate(myself))))
>>>>>>> 18e18a39d8ae23ea5db33758a52c865eb91f6a21
      .toPromise();
  }

  setUser(user: IUser) {
    this.store({ ...this.$myself.value, user: user }, true);
  }

  setHost(host: IHostStub) {
    this.store({ ...this.$myself.value, host: host }, true);
  }

  setUserHostInfo(userHostInfo:IUserHostInfo) {
    this.store({ ...this.$myself.value, host_info: userHostInfo });
  }
}

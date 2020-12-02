import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";

import { IUser } from "@cxss/interfaces";

@Injectable({
  providedIn: "root",
})
export class ProfileService {
  private currentProfileSubject: BehaviorSubject<IUser> = new BehaviorSubject(null);
  public currentProfile: Observable<any>;

  public get currentProfileValue() {
    return this.currentProfileSubject.getValue();
  }

  selectedTab: BehaviorSubject<string> = new BehaviorSubject("plants");
  cachedTabs = [];

  constructor(private http: HttpClient) {
    this.currentProfile = this.currentProfileSubject.asObservable();
  }

  getUserByUsername(username: string) {
    return this.http
      .get<IUser>(`/api/users/u/${username}`)
      .pipe(
        map((user) => {
          this.currentProfileSubject.next(user);
          return user;
        })
      )
      .toPromise();
  }
}

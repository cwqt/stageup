import { Injectable } from "@angular/core";
import { of, Observable, BehaviorSubject } from "rxjs";
import { tap, map } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";

import { IUser, IUserStub, IDeviceStub, IOrgStub } from "@cxss/interfaces";

@Injectable({
  providedIn: "root",
})
export class UserService {
  userOrgs: BehaviorSubject<IOrgStub[]> = new BehaviorSubject([]);
  private $currentUser: BehaviorSubject<IUser>;
  public currentUser: Observable<IUser>; //read-only

  public get currentUserValue() {
    return this.$currentUser.value;
  }

  constructor(private http: HttpClient) {
    this.$currentUser = new BehaviorSubject(
      JSON.parse(localStorage.getItem("currentUser"))
    );
    this.currentUser = this.$currentUser.asObservable();
  }

  register(user: IUserStub) {
    return this.http.post("/api/users", user);
  }

  changeAvatar(formData: FormData): Observable<IUser> {
    return this.http.put<IUser>(
      `/api/users/${this.currentUserValue._id}/avatar`,
      formData
    );
  }

  updateUser(json: any) {
    return this.http.put(`/api/users/${this.currentUserValue._id}`, json);
  }

  setUser(user: IUser) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    this.$currentUser.next(user);
  }

  updateCurrentUser() {
    return this.http
      .get<IUser>(`/api/users/${this.currentUserValue._id}`)
      .pipe(
        map((user) => {
          this.setUser(user);
          this.getUserOrgs();
        })
      )
      .toPromise();
  }

  createDevice(content: any) {
    return this.http
      .post<IDeviceStub>(
        `/api/users/${this.currentUserValue._id}/devices`,
        content
      )
      .toPromise();
  }

  getUserByUsername(username: string): Promise<IUser> {
    return this.http.get<IUser>(`/api/users/u/${username}`).toPromise();
  }

  getUserOrgs(): Promise<IOrgStub[]> {
    return this.http
      .get<IOrgStub[]>(`/api/users/${this.currentUserValue._id}/orgs`)
      .pipe(tap((orgs) => this.userOrgs.next(orgs)))
      .toPromise();
  }
}

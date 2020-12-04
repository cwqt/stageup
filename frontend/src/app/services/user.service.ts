import { Injectable } from "@angular/core";
import { of, Observable, BehaviorSubject } from "rxjs";
import { tap, map } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";

import { IUser, IUserStub, IHostStub, IHost } from "@eventi/interfaces";

@Injectable({
  providedIn: "root",
})
export class UserService {
  userHost: BehaviorSubject<IHost> = new BehaviorSubject(null);
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

  register(user:Pick<IUser, "name" | "username"> & { password: string }) {
    return this.http.post("/api/users", user);
  }

  changeAvatar(formData: FormData): Promise<IUser> {
    return this.http.put<IUser>(
      `/api/users/${this.currentUserValue._id}/avatar`,
      formData
    ).toPromise();
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
          this.getUserHost();
        })
      )
      .toPromise();
  }

  getUserByUsername(username: string): Promise<IUser> {
    return this.http.get<IUser>(`/api/users/u/${username}`).toPromise();
  }

  getUserHost(): Promise<IHost> {
    return this.http
      .get<IHost>(`/api/users/${this.currentUserValue._id}/host`)
      .pipe(tap(host => this.userHost.next(host)))
      .toPromise();
  }
}

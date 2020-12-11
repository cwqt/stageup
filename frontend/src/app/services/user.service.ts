import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject, Subject } from "rxjs";
import { tap, map } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";

import { IUser, IHost, IUserStub, Primitive } from "@eventi/interfaces";
import { MyselfService } from './myself.service';

@Injectable({
  providedIn: "root",
})
export class UserService {
  private $currentUser: BehaviorSubject<IUser> = new BehaviorSubject(null);

  public get currentUserValue() { return this.$currentUser.value }
  public get userId() { return this.$currentUser.value._id }

  constructor(private http: HttpClient, private myselfService:MyselfService) {
    this.myselfService.$myself.subscribe(m => {
      this.$currentUser.next(m.user);
    })
  }

  register(user: Pick<IUser, "name" | "username"> & { password: string }):Promise<IUser> {
    return this.http.post<IUser>("/api/users", user).toPromise();
  }

  updateUser(userId:number, body:{[index:string]:Primitive}):Promise<IUser> {
    return this.http
      .put<IUser>(`/api/users/${userId}`, body)
      .pipe(tap(u => {
        if(u._id == userId) {
          this.myselfService.setUser(u);
        }
      }))
      .toPromise();
  }

  getUserByUsername(username:string): Promise<IUser> {
    return this.http.get<IUser>(`/api/users/u/${username}`).toPromise();
  }

  getUserHost(userId:number): Promise<IHost> {
    return this.http
      .get<IHost>(`/api/users/${userId}/host`)
      .toPromise();
  }

  changeAvatar(userId:number, formData: FormData): Promise<IUser> {
    return this.http
      .put<IUser>(`/api/users/${userId}/avatar`, formData)
      .pipe(tap(u => {
        if(u._id == userId) {
          this.myselfService.setUser(u);
        }
      }))
      .toPromise();
  }
}

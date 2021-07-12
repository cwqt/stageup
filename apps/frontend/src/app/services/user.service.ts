import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import * as fd from 'form-data';
import { IEnvelopedData, IUser, IHost, IFollowing, Primitive, IMyself, IUserStub, IPasswordReset, IUserPrivate } from '@core/interfaces';
import { MyselfService } from './myself.service';
import { UserHostInfo } from '@core/api';
import { VolumeId } from 'aws-sdk/clients/storagegateway';
import { body } from 'express-validator';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private $currentUser: BehaviorSubject<IUser> = new BehaviorSubject(null);

  public get currentUserValue() {
    return this.$currentUser.value;
  }
  public get userId() {
    return this.$currentUser.value._id;
  }

  constructor(private http: HttpClient, private myselfService: MyselfService) {
    this.myselfService.$myself.subscribe(m => {
      this.$currentUser.next(m?.user);
    });
  }

  register(user: Pick<IUserPrivate, 'username' | 'email_address'> & { password: string }): Promise<IMyself['user']> {
    return this.http.post<IMyself['user']>('/api/users', user).toPromise();
  }

  updateUser(userId: string, body: { [index: string]: Primitive }): Promise<IMyself['user']> {
    return this.http
      .put<IMyself['user']>(`/api/users/${userId}`, body)
      .pipe(
        tap(u => {
          if (u._id == userId) {
            this.myselfService.setUser(u);
          }
        })
      )
      .toPromise();
  }

  getUserByUsername(username: string): Promise<IUser> {
    return this.http.get<IUser>(`/api/users/u/${username}`).toPromise();
  }

  getUserHost(userId: string): Promise<IHost> {
    return this.http.get<IHost>(`/api/users/${userId}/host`).toPromise();
  }

  changeAvatar(userId: string, fd: FormData): Promise<string> {
    return this.http.put<string>(`/api/users/${userId}/avatar`, fd).toPromise();
  }

  //router.post <void> ("/users/forgot-password", Users.forgotPassword())
  forgotPassword(email_address: string): Promise<void> {
    return this.http
      .post<void>(`/api/users/forgot-password`, { email_address: email_address })
      .toPromise();
  }

  //router.put <void> ("/users/reset-password", Users.resetForgottenPassword());
  resetForgottenPassword(otp: string, new_password: string): Promise<void> {
    return this.http
      .put<void>(`/api/users/reset-password?otp=${otp}`, { new_password: new_password })
      .toPromise();
  }

  // Not currently being used (as current user's followers are retrieved in Myself Service).
  // Left for now in case in future it will be useful to view other peoeple's followers
  //router.get <IEnvelopedData<IFollowing[]>> ("/users/:uid/following", Users.readUserFollows());
  readUserFollows(userId: string): Promise<IEnvelopedData<IFollowing[]>> {
    return this.http
    .get<IEnvelopedData<IFollowing[]>>(`/api/users/${userId}/following`)
    .toPromise();
  }
}

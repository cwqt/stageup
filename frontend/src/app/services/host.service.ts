import { Injectable } from "@angular/core";
import { IUser, IUserHostInfo } from "@eventi/interfaces";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { map, tap } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { UserService } from "./user.service";
import { IHost, IHostStub } from "@eventi/interfaces";
import { MyselfService } from './myself.service';

@Injectable({
  providedIn: "root",
})
export class HostService {
  private $currentHost:BehaviorSubject<IHostStub> = new BehaviorSubject(null);;
  private $currentUserHostInfo:BehaviorSubject<IUserHostInfo> = new BehaviorSubject(null);;

  public get hostId() { return this.$currentHost.value._id }
  public get userHostPermission() { return this.$currentUserHostInfo.value.permissions }
  public get currentHostValue() { return this.$currentHost.value }
  public get currentUserHostInfoValue() { return this.$currentUserHostInfo.value }

  constructor(private http: HttpClient, private myselfService:MyselfService) {
    this.myselfService.$myself.subscribe(m => {
      this.$currentHost.next(m?.host);
      this.$currentUserHostInfo.next(m?.host_info);
    })
  }

  getUserHostInfo(hostId:number, userId:number):Promise<IUserHostInfo> {
    return this.http
      .get<IUserHostInfo>(`/api/hosts/${hostId}/permissions?user=${userId}`)
      .pipe(tap(hi => this.myselfService.setUserHostInfo(hi)))
      .toPromise();
  }

  createHost(data: Pick<IHost, "name" | "username">): Promise<IHost> {
    console.log('-->', this.http)
    return this.http
      .post<IHost>("/api/hosts", data)
      .pipe(tap(d => this.myselfService.setHost(d)))
      .toPromise();
  }

  getHost(hostId: number): Promise<IHost> {
    return this.http.get<IHost>(`/api/hosts/${hostId}`).toPromise();
  }
}

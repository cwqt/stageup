import { Injectable } from "@angular/core";
import { IUser, IUserHostInfo } from "@eventi/interfaces";
import { BehaviorSubject } from "rxjs";
import { tap } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { UserService } from "./user.service";
import { IHost, IHostStub } from "@eventi/interfaces";

@Injectable({
  providedIn: "root",
})
export class HostService {
  currentHost: BehaviorSubject<IHostStub | null> = new BehaviorSubject(null);
  currentUserHostInfo:BehaviorSubject<IUserHostInfo | null> = new BehaviorSubject(null);

  constructor(private userService: UserService, private http: HttpClient) {}

  get hostId() { return this.currentHost.value._id }

  getUserPermissions(host_id:number, user_id:number) {
    return this.http.get(`/api/hosts/${host_id}/permissions?user=${user_id}`)
  }

  createHost(data: Pick<IHost, "name" | "username">): Promise<IHost> {
    return this.http
      .post<IHost>("/api/hosts", data)
      .pipe(tap((d) => this.userService.userHost.next(d)))
      .toPromise();
  }

  getHost(hostId: number): Promise<IHost> {
    return this.http.get<IHost>(`/api/hosts/${hostId}`).toPromise();
  }

  setActiveHost(host: IHostStub, userHostInfo:IUserHostInfo) {
    this.currentHost.next(host);
    this.currentUserHostInfo.next(userHostInfo)
  }
}

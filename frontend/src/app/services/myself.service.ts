import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IHostStub, IMyself, IUser } from '@eventi/interfaces';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HostService } from './host.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class MyselfService {
  $myself:BehaviorSubject<IMyself | null>;

  constructor(private http:HttpClient, private hostService:HostService, private userService:UserService) {
    this.$myself = new BehaviorSubject(this.hydrate());
  }

  store(myself:IMyself | null) {
    if(myself == null) {
      localStorage.removeItem("lastMyself");
    } else {
      localStorage.setItem("lastMyself", JSON.stringify(myself));
    }
  }

  /**
   * @description re-hydrate services with a stored myself or new myself
   * @param myself current user ( and host / host info if part of one)
   */
  hydrate(myself?:IMyself):IMyself | null {
    const me:IMyself | null = myself || JSON.parse(localStorage.getItem("lastMyself"));

    if(me) {
      this.hostService.setActiveHost(me.host, me.host_info);
      this.userService.setActiveUser(me.user);
      this.store(me);  
    }

    return me;
  } 

  getMyself():Promise<IMyself> {
    return this.http.get<IMyself>(`/api/myself`).pipe(
      tap(myself => this.hydrate(myself))
    ).toPromise();
  }

  setUser(user:IUser) {
    const myself = this.$myself.value;
    this.store({...myself, user: user});
  }

  setHost(host:IHostStub) {
    const myself = this.$myself.value;
    this.store({...myself, host: host});
  }
}

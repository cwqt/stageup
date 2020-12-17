import { Injectable } from "@angular/core";
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { MyselfService } from '../services/myself.service';

import { UserService } from "../services/user.service";

@Injectable({ providedIn: "root" })
export class LoggedInGuard implements CanActivate {
  constructor(private router: Router, private myselfService: MyselfService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUser = this.myselfService.$myself?.value?.user;

    console.log(this.myselfService.$myself.value)

    if (currentUser && !currentUser.is_new_user) {
      // authorised so return true
      return true;
    }

    // not logged in so redirect to login page with the return url
    // this.router.navigate(["/"], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

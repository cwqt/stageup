import { Injectable } from "@angular/core";
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";

import { UserService } from "../services/user.service";

@Injectable({ providedIn: "root" })
export class LoggedInGuard implements CanActivate {
  constructor(private router: Router, private userService: UserService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUser = this.userService.currentUserValue;

    if (currentUser && !currentUser.is_new_user) {
      // authorised so return true
      return true;
    }

    // not logged in so redirect to login page with the return url
    // this.router.navigate(["/"], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

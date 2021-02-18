import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { Injectable } from "@angular/core";
import { LoggedInGuard } from "./LoggedIn.guard";

@Injectable({ providedIn: "root" })
export class NegateLoggedInGuard implements CanActivate {
  constructor(private _userLoggedInGuard: LoggedInGuard) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return !this._userLoggedInGuard.canActivate(route, state);
  }
}

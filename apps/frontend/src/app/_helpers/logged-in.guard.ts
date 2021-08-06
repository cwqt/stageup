import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AppService } from '../services/app.service';
import { MyselfService } from '../services/myself.service';

@Injectable({ providedIn: 'root' })
export class LoggedInGuard implements CanActivate {
  constructor(private router: Router, private myselfService: MyselfService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot, redirect: boolean = true) {
    const currentUser = this.myselfService.$myself?.value?.user;

    if (currentUser) return true;
    if (redirect) this.router.navigate([`/`]);
    return false;
  }
}

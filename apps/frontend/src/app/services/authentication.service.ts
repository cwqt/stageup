import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggedInGuard } from '../_helpers/logged-in.guard';
import { MyselfService } from './myself.service';
import { DtoLogin, IUser } from '@core/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  $loggedIn: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private http: HttpClient,
    private myselfService: MyselfService,
    private cookieService: CookieService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  checkLoggedIn() {
    this.$loggedIn.next(
      new LoggedInGuard(this.router, this.myselfService).canActivate(
        this.route.snapshot,
        this.router.routerState.snapshot,
        false
      )
    );
    return this.$loggedIn.getValue();
  }

  login(data: DtoLogin): Promise<IUser> {
    return this.http
      .post<IUser>('/api/users/login', data, { withCredentials: true })
      .pipe(
        tap(user => {
          // Remove last logged in user stored
          this.myselfService.store(null);
          this.myselfService.getMyself().then(() => {
            this.$loggedIn.next(true);
            // override set cookie consent, because of legimate interest
            // https://alacrityfoundationteam31.atlassian.net/browse/SU-465
            this.myselfService.setCookiesConsent(true);
          });
        })
      )
      .toPromise();
  }

  logout() {
    this.$loggedIn.next(false);
    this.cookieService.delete('connect.sid');
    this.myselfService.store(null, true);
    this.http.post('/api/users/logout', {});
    this.router.navigate(['/']);
  }
}

import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { map, tap } from "rxjs/operators";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CookieService } from "ngx-cookie-service";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "./user.service";
import { LoggedInGuard } from "../_helpers";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  $loggedIn: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private cookieService: CookieService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  checkLoggedIn() {
    this.$loggedIn.next(
      new LoggedInGuard(this.router, this.userService).canActivate(
        this.route.snapshot,
        this.router.routerState.snapshot
      )
    );
    return this.$loggedIn.getValue();
  }

  login(formData) {
    return this.http
      .post<any>("/api/users/login", formData, { withCredentials: true })
      .pipe(
        map((user) => {
          this.userService.setUser(user);
          this.router.navigate(["/"]);
          return user;
        })
      );
  }

  logout() {
    this.cookieService.set("connect.sid", null);
    this.userService.setUser(null);
    localStorage.removeItem("currentUser");
    this.router.navigate(["/"]);
    return this.http.post<any>("/api/users/logout", {});
  }
}

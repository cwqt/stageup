import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from "../environments/environment";
import { IUser } from "@cxss/interfaces";

import { UserService } from "./services/user.service";
import { HostService } from "./services/host.service";
import { MatDialog } from "@angular/material/dialog";
import { Title } from "@angular/platform-browser";
import { AuthenticationService } from "./services/authentication.service";
import { LoggedInGuard, NegateLoggedInGuard } from './_helpers';

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  loading: boolean = true;

  constructor(
    public dialog: MatDialog,
    private userService: UserService,
    private hostService: HostService,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthenticationService
  ) {
    console.log(
      `Running in: ${environment.production ? "production" : "development"}`
    );
  }

  async ngOnInit() {
    this.loading = true;
    this.titleService.setTitle("Eventi");

    // Upon start up, immediately get the new user & set last active org
    const isLoggedIn = new LoggedInGuard(this.router, this.userService)
      .canActivate(this.route.snapshot, this.router.routerState.snapshot);

    console.log(isLoggedIn)

    if (isLoggedIn) {
      this.userService.updateCurrentUser();
    } else {
      this.authService.logout();
    }
    this.loading = false;
  }
}

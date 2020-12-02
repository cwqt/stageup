import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from "../environments/environment";
import { IUser } from "@cxss/interfaces";

import { UserService } from "./services/user.service";
import { OrganisationService } from "./services/organisation.service";
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
    private orgService: OrganisationService,
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
    this.titleService.setTitle("mcn — Index");

    //Upon start up, immediately get the new user & set last active org
    const isLoggedIn = new LoggedInGuard(this.router, this.userService)
      .canActivate(this.route.snapshot, this.router.routerState.snapshot);

    if (isLoggedIn) await this.updateCurrentLoggedInUser();
    this.loading = false;
  }

  async updateCurrentLoggedInUser() {
    await this.userService.updateCurrentUser();

    try {
      const orgs = await this.userService.getUserOrgs();
      const lastActiveOrgId = localStorage.getItem("lastActiveOrg");

      // Set current org to last set, or the 1st if none set
      if (orgs.length) {
        this.orgService.setActiveOrg(lastActiveOrgId ?
          orgs.find((o) => o._id == lastActiveOrgId) :
          orgs[0]
        )
      }
    } catch (error) {
      if (error.status == 401) {
        this.authService.logout();
      }
    }
  }
}

import { Component, OnInit, Input } from "@angular/core";
import { OrganisationService } from "src/app/services/organisation.service";
import { UserService } from "src/app/services/user.service";

import { IOrgStub } from "@cxss/interfaces";
import { Router } from "@angular/router";

@Component({
  selector: "app-header-bar",
  templateUrl: "./header-bar.component.html",
  styleUrls: ["./header-bar.component.scss"],
})
export class HeaderBarComponent implements OnInit {
  @Input() currentUser: any;
  userOrgs: IOrgStub[];
  activeOrg: IOrgStub;

  constructor(
    private orgService: OrganisationService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.userOrgs.subscribe((orgs) => {
      this.userOrgs = orgs;
    });
    this.orgService.currentOrg.subscribe((org) => (this.activeOrg = org));
  }

  setActiveOrg(org: IOrgStub) {
    this.orgService.setActiveOrg(org);
  }

  gotoCatalog() {
    this.router.navigate(["catalog"]);
  }

  gotoRoot() {
    this.router.navigate(["/"]);
  }
}

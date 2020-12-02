import { Component, OnInit } from "@angular/core";
import { IOrgStub, IOrgEnv } from "@cxss/interfaces";
import { UserService } from "src/app/services/user.service";
import { Router, ActivatedRoute } from "@angular/router";
import { OrganisationService } from "src/app/services/organisation.service";
import { MatTabChangeEvent } from "@angular/material/tabs";

@Component({
  selector: "app-index",
  templateUrl: "./index.component.html",
  styleUrls: ["./index.component.scss"],
})
export class IndexComponent implements OnInit {
  userOrgs: IOrgStub[];
  currentOrg: IOrgStub;
  activeUrl: string = "devices";

  cache = {
    env: {
      data: null,
      loading: false,
      error: "",
    },
  };

  tabs = {
    ["dashboard"]: { icon: "workspace", url: "/" },
    ["farms"]: { icon: "sprout", url: "farms" },
    ["devices"]: { icon: "chip", url: "devices" },
    ["yields"]: { icon: "money", url: "yields" },
    ["members"]: { icon: "user--multiple", url: "members" },
  };

  env: IOrgEnv;

  constructor(
    private userService: UserService,
    private orgService: OrganisationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userService.userOrgs.subscribe((orgs) => (this.userOrgs = orgs));
    this.orgService.currentOrg.subscribe((org) => {
      this.currentOrg = org;
      this.getOrgEnvironment(this.currentOrg._id);
    });
  }

  navigate(route: string) {
    this.router.navigate([route.toLowerCase()]);
  }

  random() {
    return Math.floor(Math.random() * 100);
  }

  selectedTabChange(event: MatTabChangeEvent) {
    this.router.navigate([`/${Object.values(this.tabs)[event.index].url}`]);
  }

  getOrgEnvironment(_id: string) {
    this.cache.env.loading = true;
    this.orgService
      .getEnvironment(_id)
      .then((env: IOrgEnv) => (this.cache.env.data = env))
      .catch((e) => (this.cache.env.error = e))
      .finally(() => (this.cache.env.loading = false));
  }

  asIsOrder(a, b) {
    return 1;
  }
}

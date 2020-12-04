import { Component, OnInit } from "@angular/core";
import { IHost, IHostStub } from "@cxss/interfaces";
import { UserService } from "src/app/services/user.service";
import { Router, ActivatedRoute } from "@angular/router";
import { HostService } from "src/app/services/host.service";
import { MatTabChangeEvent } from "@angular/material/tabs";

@Component({
  selector: "app-index",
  templateUrl: "./index.component.html",
  styleUrls: ["./index.component.scss"],
})
export class IndexComponent implements OnInit {
  userHost: IHost;
  activeUrl: string = "devices";

  cache = {
    env: {
      data: null,
      loading: false,
      error: "",
    },
  };

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

  }

  navigate(route: string) {
    this.router.navigate([route.toLowerCase()]);
  }

  random() {
    return Math.floor(Math.random() * 100);
  }

  asIsOrder(a, b) {
    return 1;
  }
}

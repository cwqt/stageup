import { Component, OnInit } from "@angular/core";
import { AuthenticationService } from "src/app/services/authentication.service";
import { Router } from "@angular/router";
import { Popover } from "src/assets/popover";

@Component({
  selector: "app-header-bar-user-menu",
  templateUrl: "./header-bar-user-menu.component.html",
  styleUrls: ["./header-bar-user-menu.component.scss"],
})
export class HeaderBarUserMenuComponent implements OnInit {
  constructor(
    private popover: Popover,
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  logout() {
    this.popover.close();
    this.authService.logout();
  }

  gotoDocumentation() {
    this.popover.close();
    this.router.navigate(["/documentation"]);
  }

  gotoSettings() {
    this.popover.close();
    this.router.navigate(["/settings"]);
  }
}

import { Component, OnInit, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { IMyself } from '@core/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { AuthenticationService } from "apps/frontend/src/app/services/authentication.service";
import { LoginComponent } from "../../../routes/landing/login/login.component";
import { RegisterComponent } from "../../../routes/landing/register/register.component";
import { HelperService } from "../../../services/helper.service";
import { PerformanceService } from "../../../services/performance.service";

@Component({
  selector: "app-header-bar",
  templateUrl: "./header-bar.component.html",
  styleUrls: ["./header-bar.component.scss"],
})
export class HeaderBarComponent implements OnInit {
  @Input() myself: IMyself;

  userPopupOpen:boolean = false;

  constructor(
    private baseAppService:BaseAppService,
    private authService:AuthenticationService,
    private helperService:HelperService,
    private dialog:MatDialog
  ) {}

  ngOnInit(): void {
  }

  gotoCatalog() {
    this.baseAppService.navigateTo("/catalog");
  }

  gotoRoot() {
    this.baseAppService.navigateTo("/");
  }

  toggleUserPopup(state:boolean) {
    this.userPopupOpen = state;
  }

  userLogout() {
    this.authService.logout();
  }

  userSettings() {
    // Link to a settings user/host
  }

  userProfile() {
    this.baseAppService.navigateTo(`/settings/profile`);
  }

  searchPerformances(searchQuery: string){
    this.baseAppService.navigateTo(`/results`, { queryParams: { search_query: searchQuery  }});
  }

  openLoginDialog() {
    this.baseAppService.navigateTo(`/login`);
  }

  openRegisterDialog() {
    this.baseAppService.navigateTo(`/register`);
  }
}

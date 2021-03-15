import { Component, OnInit, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { IMyself } from '@core/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { AuthenticationService } from "apps/frontend/src/app/services/authentication.service";
import { HelperService } from "../../../services/helper.service";
import { SearchService } from "../../../services/search.service";

@Component({
  selector: "app-header-bar",
  templateUrl: "./header-bar.component.html",
  styleUrls: ["./header-bar.component.scss"],
})
export class HeaderBarComponent implements OnInit {
  @Input() myself: IMyself;

  userPopupOpen:boolean = false;

  constructor(
    private searchService:SearchService,
    private baseAppService:BaseAppService,
    private authService:AuthenticationService
  ) {}

  ngOnInit(): void {
  }

  gotoCatalog() {
    this.baseAppService.navigateTo("/catalog");
  }

  gotoRoot() {
    this.baseAppService.navigateTo("/");
  }

  search(event:string) {
    this.searchService.$searchQuery.next(event);
    this.baseAppService.navigateTo(`/search`, { queryParams: { query: event }});
  }

  toggleUserPopup(state:boolean) {
    this.userPopupOpen = state;
  }

  userLogout() {
    this.authService.logout();
  }

  openLoginDialog() {
    this.baseAppService.navigateTo(`/login`);
  }

  openRegisterDialog() {
    this.baseAppService.navigateTo(`/register`);
  }
}

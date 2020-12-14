import { Component, OnInit, Input } from "@angular/core";
import { IMyself } from '@eventi/interfaces';
import { BaseAppService } from 'src/app/services/app.service';

@Component({
  selector: "app-header-bar",
  templateUrl: "./header-bar.component.html",
  styleUrls: ["./header-bar.component.scss"],
})
export class HeaderBarComponent implements OnInit {
  @Input() myself: IMyself;

  constructor(
    private appService:BaseAppService
  ) {}

  ngOnInit(): void {
  }

  gotoCatalog() {
    this.appService.navigateTo("/catalog");
  }

  gotoRoot() {
    this.appService.navigateTo("/");
  }
}

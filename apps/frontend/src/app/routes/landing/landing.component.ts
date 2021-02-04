import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { Environment, IMyself, IUser } from '@core/interfaces';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { UserService } from "apps/frontend/src/app/services/user.service";
import { environment } from '../../../environments/environment';

@Component({
  selector: "app-landing",
  templateUrl: "./landing.component.html",
  styleUrls: ["./landing.component.scss"],
})
export class LandingComponent implements OnInit {
  myself: IMyself;
  isLoggedIn:boolean = false;
  isProduction:boolean = environment.environment == Environment.Production;
  isStaging:boolean = environment.environment == Environment.Staging;
  isLive:boolean;

  constructor(private myselfService:MyselfService, private router:Router) {}

  ngOnInit(): void {
    this.isLive = this.isProduction || this.isStaging;

    this.myselfService.$myself.subscribe(m => this.myself = m);
    console.log(environment);
  }

  scroll(el:HTMLElement) {
    el.scrollIntoView();
  }

  gotoLogin() { this.router.navigate(["/login"]); }
  gotoRegister() { this.router.navigate(["/register"]); }
  gotoMailingList() {}
}

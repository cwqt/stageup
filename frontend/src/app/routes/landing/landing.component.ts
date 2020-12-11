import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { IMyself, IUser } from "@eventi/interfaces";
import { MyselfService } from 'src/app/services/myself.service';
import { UserService } from "src/app/services/user.service";
import { environment } from '../../../environments/environment';

@Component({
  selector: "app-landing",
  templateUrl: "./landing.component.html",
  styleUrls: ["./landing.component.scss"],
})
export class LandingComponent implements OnInit {
  myself: IMyself;
  isLoggedIn:boolean = false;
  isProduction:boolean = environment.production;

  constructor(private myselfService:MyselfService, private router:Router) {}

  scroll(el:HTMLElement) {
    el.scrollIntoView();
  }

  gotoLogin() { this.router.navigate(["/login"]); }
  gotoRegister() { this.router.navigate(["/register"]); }

  ngOnInit(): void {
    this.myselfService.$myself.subscribe(m => this.myself = m);
  }
}

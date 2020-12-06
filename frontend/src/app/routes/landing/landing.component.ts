import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { IUser } from "@eventi/interfaces";
import { UserService } from "src/app/services/user.service";
import { environment } from '../../../environments/environment';

@Component({
  selector: "app-landing",
  templateUrl: "./landing.component.html",
  styleUrls: ["./landing.component.scss"],
})
export class LandingComponent implements OnInit {
  currentUser: IUser;
  isLoggedIn:boolean = false;
  isProduction:boolean = environment.production;

  constructor(private userService: UserService, private router:Router) {}

  scroll(el:HTMLElement) {
    el.scrollIntoView();
  }

  gotoLogin() { this.router.navigate(["/login"]); }
  gotoRegister() { this.router.navigate(["/register"]); }

  ngOnInit(): void {
    this.userService.currentUser.subscribe((x) => {
      this.currentUser = x;
      if (this.currentUser) {
        console.log("already logged in");
        if (this.currentUser.is_new_user) {
          console.log("needs to do first time stuff");
        } else {
          // this.router.navigate(["/"]);
        }
      }
    });
  }
}

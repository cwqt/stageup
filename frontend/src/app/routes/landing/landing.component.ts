import { Component, OnInit } from "@angular/core";
import { IUser } from "@cxss/interfaces";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-landing",
  templateUrl: "./landing.component.html",
  styleUrls: ["./landing.component.scss"],
})
export class LandingComponent implements OnInit {
  currentUser: IUser;
  isLoggedIn:boolean = false;


  constructor(private userService: UserService) {}

  scroll(el:HTMLElement) {
    el.scrollIntoView();
  }

  ngOnInit(): void {
    this.userService.currentUser.subscribe((x) => {
      this.currentUser = x;
      if (this.currentUser) {
        console.log("already logged in");
        if (this.currentUser.new_user) {
          console.log("needs to do first time stuff");
        } else {
          // this.router.navigate(["/"]);
        }
      }
    });
  }
}

import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { UserService } from "src/app/services/user.service";
import { ActivatedRoute, Router } from "@angular/router";

import { IUser } from "@eventi/interfaces";

import { ProfileService } from "src/app/services/profile.service";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ProfileComponent implements OnInit {
  loading: boolean = true;
  tabIndex: number = 0;
  showOutlet: boolean = false;
  outletTitle: string = "Post";
  canLoadTabContents: BehaviorSubject<boolean> = new BehaviorSubject(false);

  authorUser: IUser | undefined;
  currentUser: IUser; //the current logged in user


  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService
  ) {
    this.showOutlet = false;
  }

  ngOnInit(): void {
    //route param change request different user
    this.route.params.subscribe((params) => {
      console.log(params);

      this.profileService
        .getUserByUsername(params.username)
        .then((user) => (this.authorUser = user))
        .then(() => (this.loading = false))
        .catch((e) => {
          console.log(e);
          this.loading = false;
        });
    });

    this.userService.currentUser.subscribe((user) => (this.currentUser = user));
    console.log();
  }

  setCanLoadTabContent() {
    this.canLoadTabContents.next(true);
  }

  onActivate() {
    setTimeout(() => {
      this.showOutlet = true;
    }, 0);
  }

  onDeactivate() {
    setTimeout(() => {
      this.showOutlet = false;
    }, 0);
  }

  goBackToProfile() {
    this.router.navigate([`/${this.currentUser.username}`]);
  }

  pretty(label: string) {
    return (label.charAt(0).toUpperCase() + label.slice(1)).slice(0, -1);
  }
}

import { Component, OnInit } from "@angular/core";
import { environment } from "../environments/environment";
import { Title } from "@angular/platform-browser";
import { AuthenticationService } from "./services/authentication.service";
import { MyselfService } from './services/myself.service';
import { FormControl } from "@angular/forms";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  loading: boolean = true;

  constructor(
    private myselfService:MyselfService,
    private titleService: Title,
    private authService: AuthenticationService
  ) {
    console.log(
      `Running in: ${environment.production ? "production" : "development"}`
    );
  }

  async ngOnInit() {
    this.loading = true;
    this.titleService.setTitle("StageUp");

    // Upon start up, check if logged in by re-hydrating stored data (if any exists)
    // and then re-fetch the user incase of any changes
    if (this.authService.checkLoggedIn()) {
      this.myselfService.getMyself();
    } else {
      console.log('Not logged in, Logging out...')
      this.authService.logout();
    }

    setTimeout(() => {
      this.loading = false;
    }, 0);
  }
}

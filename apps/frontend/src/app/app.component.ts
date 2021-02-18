import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from './services/authentication.service';
import { MyselfService } from './services/myself.service';
import { ToastService } from './services/toast.service';
import { ThemeKind } from './ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  loading: boolean = true;

  constructor(
    private myselfService: MyselfService,
    private titleService: Title,
    private authService: AuthenticationService,
    private toastService:ToastService
  ) {
    console.log(`Running in: ${environment.environment}`);
  }

  async ngOnInit() {
    this.loading = true;
    this.titleService.setTitle('StageUp');

    // Upon start up, check if logged in by re-hydrating stored data (if any exists)
    // and then re-fetch the user incase of any changes
    if (this.authService.checkLoggedIn()) {
      this.myselfService.getMyself();
      this.toastService.emit("Welcome back to StageUp!");
    } else {
      console.log('Not logged in, Logging out...');
      this.authService.logout();
    }

    setTimeout(() => {
      this.loading = false;
    }, 0);
  }
}

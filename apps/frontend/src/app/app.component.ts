import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from './services/authentication.service';
import { MyselfService } from './services/myself.service';
import { ToastService } from './services/toast.service';
import { ThemeKind } from './ui-lib/ui-lib.interfaces';
import { BaseAppService } from './services/app.service';
import { ActivatedRoute } from '@angular/router';

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
    private toastService:ToastService,
    private baseAppService: BaseAppService,
    private route:ActivatedRoute
  ) {
    console.log(`Running in: ${environment.environment}`);
  }

  async ngOnInit() {
    this.loading = true;
    await this.baseAppService.componentInitialising(this.route);
    this.titleService.setTitle('StageUp 0.3.0');

    // Upon start up, check if logged in by re-hydrating stored data (if any exists)
    // and then re-fetch the user incase of any changes
    if (this.authService.checkLoggedIn()) {
      await this.myselfService.getMyself();
      this.toastService.emit("Welcome back to StageUp!");

      // May be coming in from an e-mail to accept invite /?invite_accepted=...
      const invite = this.baseAppService.getQueryParam('invite_accepted');
      if (invite) this.baseAppService.navigateTo(`/host`);    
    }

    setTimeout(() => {
      this.loading = false;
    }, 100);
  }
}

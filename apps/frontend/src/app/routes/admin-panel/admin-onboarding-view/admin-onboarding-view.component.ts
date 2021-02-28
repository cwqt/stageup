import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostOnboarding } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';

@Component({
  selector: 'app-admin-onboarding-view',
  templateUrl: './admin-onboarding-view.component.html',
  styleUrls: ['./admin-onboarding-view.component.scss']
})
export class AdminOnboardingViewComponent implements OnInit {
  public onboarding:ICacheable<IHostOnboarding> = {
    data: null,
    loading: false,
    error: ""
  }

  constructor(private hostService: HostService, private baseAppService: BaseAppService, private route:ActivatedRoute) { }

  async ngOnInit() {
    await this.baseAppService.componentInitialising(this.route);
    this.getHostDetails();
  }

  async getHostDetails(){
    this.onboarding.loading = true;
    return this.hostService.readOnboardingProcessStatus(this.baseAppService.getParam(RouteParam.HostId))
      .then(data => this.onboarding.data = data)
      .catch((e:HttpErrorResponse) => this.onboarding.error = e.message)
      .finally(() => this.onboarding.loading = false);
  }
}

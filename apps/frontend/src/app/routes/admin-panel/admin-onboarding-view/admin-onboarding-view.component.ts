import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostOnboarding } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';

@Component({
  selector: 'app-admin-onboarding-view',
  templateUrl: './admin-onboarding-view.component.html',
  styleUrls: ['./admin-onboarding-view.component.scss']
})
export class AdminOnboardingViewComponent implements OnInit {
  public onboarding: ICacheable<IHostOnboarding> = createICacheable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { route: ActivatedRoute },
    private hostService: HostService,
    private appService: AppService
  ) {}

  async ngOnInit() {
    // https://github.com/angular/components/issues/13803
    await this.appService.componentInitialising(this.data.route);

    return cachize(
      this.hostService.readOnboardingProcessStatus(this.appService.getParam(RouteParam.HostId)),
      this.onboarding
    );
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostOnboarding } from '@eventi/interfaces';
import { ICacheable } from 'src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'src/app/services/app.service';
import { HostService } from 'src/app/services/host.service';

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

  constructor(private hostService: HostService, private baseAppService: BaseAppService) { }

  ngOnInit(): void {
    this.getHostDetails();
  }

  async getHostDetails(){
    this.onboarding.data = await this.hostService.readOnboardingProcessStatus(this.baseAppService.getParam(RouteParam.HostId) as unknown as number);
  }
}

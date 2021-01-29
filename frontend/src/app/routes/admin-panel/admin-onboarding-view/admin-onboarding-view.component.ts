import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostOnboarding } from '@eventi/interfaces';
import { HostService } from 'src/app/services/host.service';

@Component({
  selector: 'app-admin-onboarding-view',
  templateUrl: './admin-onboarding-view.component.html',
  styleUrls: ['./admin-onboarding-view.component.scss']
})
export class AdminOnboardingViewComponent implements OnInit {

  public hostName: IHostOnboarding;

  constructor(private hostService: HostService, private _Activatedroute:ActivatedRoute) { }

  ngOnInit(): void {
    this.getHostDetails();
  }

  async getHostDetails(){
    this.hostName = await this.hostService.readOnboardingProcessStatus(this._Activatedroute.snapshot.paramMap.get("hostId") as unknown as number);
  }
}

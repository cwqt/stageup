import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHost } from '@eventi/interfaces';
import { HostService } from 'src/app/services/host.service';

@Component({
  selector: 'app-admin-onboarding-view',
  templateUrl: './admin-onboarding-view.component.html',
  styleUrls: ['./admin-onboarding-view.component.scss']
})
export class AdminOnboardingViewComponent implements OnInit {

  public hostName: IHost;

  constructor(private hostService: HostService, private _Activatedroute:ActivatedRoute) { }

  ngOnInit(): void {
    this.getHost();
  }

  async getHost(){
    this.hostName = await this.hostService.getHost(this._Activatedroute.snapshot.paramMap.get("hostId") as unknown as number);
  }
}

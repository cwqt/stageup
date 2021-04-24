import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHost, IPatronTier } from '@core/interfaces';
import { timeout } from '@core/helpers';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';

@Component({
  selector: 'app-host-profile-patronage',
  templateUrl: './host-profile-patronage.component.html',
  styleUrls: ['./host-profile-patronage.component.scss']
})
export class HostProfilePatronageComponent implements OnInit {
  host: IHost; //injected from parent
  tiers: ICacheable<IPatronTier[]> = createICacheable([]);

  constructor(private hostService: HostService, private appService: BaseAppService, private route: ActivatedRoute) {}

  async ngOnInit() {
    await this.appService.componentInitialising(this.route);
    cachize(this.hostService.readPatronTiers(this.host._id), this.tiers);
  }
}

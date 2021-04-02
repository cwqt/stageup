import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostStub, IMyself, IUser } from '@core/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  myself: IMyself;

  constructor(
    private myselfService: MyselfService,
    private baseAppService: BaseAppService,
    private route: ActivatedRoute
  ) {}

  tabs: Array<{ label: string; route: string }>;

  async ngOnInit() {
    this.myself = this.myselfService.$myself.value;

    this.tabs = [
      { label: 'Your Account', route: '/settings' },
      { label: 'Payments', route: '/settings/billing' },
      { label: 'Patronage', route: '/settings/patronage' },
      { label: 'Subscriptions', route: '/settings/subscription' },
      { label: this.myself.host ? 'Host' : 'Create a Host', route: '/settings/host' }
    ];
  }

  ngAfterViewInit() {
    this.route.url.subscribe(() => {
      if (this.route.snapshot.firstChild?.url[0]) {
        // Map the selected tab to the URL 
        this.tabGroup.selectedIndex = this.tabs.findIndex(
          i => i.route.split('/').pop() == this.route.snapshot.firstChild.url[0].path
        );
      } else {
        this.tabGroup.selectedIndex = 0;
      }
    });
  }

  openTabLink(event: MatTabChangeEvent) {
    this.baseAppService.navigateTo(this.tabs[event.index].route);
  }
}

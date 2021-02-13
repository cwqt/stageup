import { Component, Input, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostStub } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { BaseAppService, RouteParam } from '../../../services/app.service';
import { HostService } from '../../../services/host.service';

@Component({
  selector: 'app-host-profile',
  templateUrl: './host-profile.component.html',
  styleUrls: ['./host-profile.component.scss']
})
export class HostProfileComponent implements OnInit {
  @Input() hostUsername?: string;
  host: ICacheable<IHost> = createICacheable();

  hostPages = {
    index: {
      label: 'Feed',
      icon: '',
      url: ''
    },
    about: {
      label: 'About',
      icon: '',
      url: 'about'
    },
    contact: {
      label: 'Contact',
      icon: '',
      url: 'contact'
    },
    merch: {
      label: 'Merch',
      icon: '',
      url: null
    }
  };

  constructor(
    private baseAppService: BaseAppService,
    private route: ActivatedRoute,
    private hostService: HostService
  ) {}

  async ngOnInit() {
    await this.baseAppService.componentInitialising(this.route);

    // If not passed through input, get from route param since this is probably on /@host_username
    if (!this.hostUsername) this.hostUsername = this.baseAppService.getParam(RouteParam.HostId).split('@').pop();

    // Get the host by username & populate the ICacheable
    cachize(this.hostService.readHostByUsername(this.hostUsername), this.host);
  }

  openHostPage(endpoint: string) {
    this.baseAppService.navigateTo(
      `${this.route.snapshot.data['isHostView'] ? '/host' : ''}/@${this.hostUsername}/${endpoint}`
    );
  }

  handleTabChange(event: MatTabChangeEvent) {
    const pageIndex = Object.keys(this.hostPages)[event.index];
    const page = this.hostPages[pageIndex];
    this.openHostPage(page.url);
  }

  openSocialLink(link: string) { window.open(link, '_blank') }
  originalOrder() { return 0 }
}

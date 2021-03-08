import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostStub } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { BaseAppService, RouteParam } from '../../../services/app.service';
import { HelperService } from '../../../services/helper.service';
import { HostService } from '../../../services/host.service';
import { ChangeImageComponent } from '../../settings/change-image/change-image.component';
import fd from 'form-data';
import { MyselfService } from '../../../services/myself.service';

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
    private myselfService:MyselfService,
    private baseAppService: BaseAppService,
    private route: ActivatedRoute,
    private hostService: HostService,
    private helperService: HelperService,
    public dialog: MatDialog
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
      `${this.route.snapshot.data['is_host_view'] ? '/host' : ''}/@${this.hostUsername}/${endpoint}`
    );
  }

  handleTabChange(event: MatTabChangeEvent) {
    const pageIndex = Object.keys(this.hostPages)[event.index];
    const page = this.hostPages[pageIndex];
    this.openHostPage(page.url);
  }

  openChangeAvatarDialog() {
    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, { data: { fileHandler: this.handleUploadHostAvatar.bind(this) } }),
      (event: IHostStub) => {
        this.host.data.avatar = event.avatar;
        this.myselfService.setHost({...this.myselfService.$myself.getValue().host, avatar: event.avatar })
      });
  }

  handleUploadHostAvatar(formData:fd) {
    return this.hostService.changeAvatar(this.host.data._id, formData);
  }

  openSocialLink(link: string) {
    window.open(link, '_blank');
  }

  originalOrder() {
    return 0;
  }
}

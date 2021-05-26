import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostStub } from '@core/interfaces';
import fd from 'form-data';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { BaseAppService, RouteParam } from '../../../services/app.service';
import { HelperService } from '../../../services/helper.service';
import { HostService } from '../../../services/host.service';
import { MyselfService } from '../../../services/myself.service';
import { ChangeImageComponent } from '@frontend/components/dialogs/change-image/change-image.component';
import { HostProfileAboutComponent } from './host-profile-about/host-profile-about.component';
import { HostProfileFeedComponent } from './host-profile-feed/host-profile-feed.component';
import { HostProfilePatronageComponent } from './host-profile-patronage/host-profile-patronage.component';

@Component({
  selector: 'app-host-profile',
  templateUrl: './host-profile.component.html',
  styleUrls: ['./host-profile.component.scss']
})
export class HostProfileComponent implements OnInit {
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  @Input() hostUsername?: string;
  host: ICacheable<IHost> = createICacheable();
  isHostView: boolean;
  tabs: Array<{ label: string; route: string }>;

  constructor(
    private myselfService: MyselfService,
    private baseAppService: BaseAppService,
    private route: ActivatedRoute,
    private hostService: HostService,
    private helperService: HelperService,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    this.tabs = [
      { label: 'Feed', route: '' },
      { label: 'About', route: 'about' },
      { label: 'Patronage', route: 'patronage' },
      { label: 'Contact', route: 'contact' },
      { label: 'Merch', route: null }
    ];

    // Change view of component depending on if on /dashboard/@user or /@user
    this.isHostView = this.route.snapshot.data['is_host_view'];
    await this.baseAppService.componentInitialising(this.route);

    // If not passed through input, get from route param since this is probably on /@host_username
    if (!this.hostUsername) this.hostUsername = this.baseAppService.getParam(RouteParam.HostId).split('@').pop();

    // Get the host by username & populate the ICacheable
    await cachize(this.hostService.readHostByUsername(this.hostUsername), this.host);

    // Wait for tabs to be in the DOM before setting tabGroup selectedIndex to route
    setTimeout(() => {
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
    }, 0);
  }

  onChildLoaded(component: HostProfileAboutComponent | HostProfileFeedComponent | HostProfilePatronageComponent) {
    component.host = this.host.data;
  }

  openTabLink(event: MatTabChangeEvent) {
    this.baseAppService.navigateTo(
      `${this.isHostView ? '/dashboard' : ''}/@${this.hostUsername}/${this.tabs[event.index].route}`
    );
  }

  openChangeAvatarDialog() {
    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, {
        data: {
          initialImage: this.host.data.avatar,
          fileHandler: this.handleUploadHostAvatar.bind(this)
        }
      }),
      (event: IHostStub) => {
        this.host.data.avatar = event.avatar;
        this.myselfService.setHost({ ...this.myselfService.$myself.getValue().host, avatar: this.host.data.avatar });
      }
    );
  }

  handleUploadHostAvatar(formData: fd) {
    return this.hostService.changeAvatar(this.host.data._id, formData);
  }

  openChangeBannerDialog() {
    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, {
        data: {
          initialImage: this.host.data.banner,
          fileHandler: this.handleUploadHostBanner.bind(this)
        }
      }),
      (event: IHostStub) => {
        this.host.data.banner = event.banner || '/assets/banner-placeholder.png';
        this.myselfService.setHost({ ...this.myselfService.$myself.getValue().host, banner: this.host.data.banner });
      }
    );
  }

  handleUploadHostBanner(formData: fd) {
    return this.hostService.changeBanner(this.host.data._id, formData);
  }

  openSocialLink(link: string) {
    window.open(this.host.data.social_info[link], '_blank');
  }

  originalOrder() {
    return 0;
  }
}

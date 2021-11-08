import { HostPermissionPipe } from '@frontend/_pipes/host-permission.pipe';
import { ICacheable, createICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HostAddMemberComponent } from './../host-members/host-add-member/host-add-member.component';
import { CreatePerformanceComponent } from './../host-performances/create-performance/create-performance.component';
import { IHost, IEnvelopedData, IUserHostInfo } from '@core/interfaces';

import { AppService } from 'apps/frontend/src/app/services/app.service';
import { HostService } from '@frontend/services/host.service';
import { IDateTimeFormatOptions, IPerformanceStub, AssetType } from '@core/interfaces';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '@frontend/services/helper.service';
import { Component, OnInit, LOCALE_ID, Inject } from '@angular/core';
import { i18n, unix, findAssets } from '@core/helpers';

@Component({
  selector: 'app-host-dashboard',
  templateUrl: './host-dashboard.component.html',
  styleUrls: ['./host-dashboard.component.scss']
})
export class HostDashboardComponent implements OnInit {
  host: IHost;

  // Events
  eventTable: UiTable<IPerformanceStub>;
  eventData: IPerformanceStub[];
  // Members
  memberTable: UiTable<IUserHostInfo>;
  hostMembers: ICacheable<IEnvelopedData<IUserHostInfo[]>> = createICacheable([]);

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private hostService: HostService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.host = this.hostService.currentHostValue;

    this.eventTable = new UiTable<IPerformanceStub>({
      resolver: async query => {
        const envelope = await this.hostService.readHostPerformances(this.host._id, query);
        this.eventData = envelope.data;
        return envelope;
      },
      columns: [
        {
          label: $localize`Event`,
          image: p => {
            const primaryAsset =
              p.assets && findAssets(p.assets, AssetType.Image, ['thumbnail', 'primary'])[0]?.location;
            return p.thumbnail || primaryAsset || '/assets/performance-placeholder.jpeg';
          },
          accessor: p => p.name
        },
        {
          label: $localize`Schedule`,
          accessor: p => {
            const options = {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: false
            } as IDateTimeFormatOptions; // Typescript Intl.DateTimeFormat missing certain properties. See https://github.com/microsoft/TypeScript/issues/35865 and https://github.com/microsoft/TypeScript/issues/38266
            return `${i18n.date(unix(p.publicity_period.start), this.locale, options)} - ${i18n.date(
              unix(p.publicity_period.end),
              this.locale,
              options
            )}`;
          }
        }
      ],
      actions: [],
      pagination: {
        page_sizes: [3],
        initial_page_size: 3,
        hide_page_size: true,
        show_first_last: true
      },
      clickable: {
        shadow: true,
        click_function: performance => this.appService.navigateTo(`/dashboard/performances/${performance.__data._id}`)
      },
      uniform_row_height: true
    });

    const hostPermissionPipe = new HostPermissionPipe();
    this.memberTable = new UiTable<IUserHostInfo>({
      resolver: query => this.hostService.readMembers(this.host._id, query),
      columns: [
        {
          label: $localize`Name`,
          accessor: member => member.user.username
        },
        {
          label: $localize`Permission`,
          accessor: member => hostPermissionPipe.transform(member.permissions)
        }
      ],
      actions: [],
      pagination: {
        page_sizes: [3],
        initial_page_size: 3,
        hide_page_size: true,
        show_first_last: true
      },
      uniform_row_height: true
    });
  }

  openCreatePerformanceDialog() {
    this.helperService.showDialog(
      this.dialog.open(CreatePerformanceComponent, { data: { host_id: this.host._id }, width: '600px' })
    );
  }

  openAddMemberDialog() {
    this.helperService.showDialog(this.dialog.open(HostAddMemberComponent), () => {
      this.memberTable.refresh();
    });
  }
}

import { CreatePerformanceComponent } from './../host-performances/create-performance/create-performance.component';
import { IHost } from '@core/interfaces';

import { AppService } from 'apps/frontend/src/app/services/app.service';
import { HostService } from '@frontend/services/host.service';
import { IPerformanceStub, AssetType } from '@core/interfaces';
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
  table: UiTable<IPerformanceStub>;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private hostService: HostService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.host = this.hostService.currentHostValue;

    this.table = new UiTable<IPerformanceStub>({
      resolver: query => this.hostService.readHostPerformances(this.host._id, query),
      columns: [
        {
          label: $localize`Event`,
          image: p => {
            let primaryAsset: string;
            // Check if the performance has assets before calling findAssets
            if (p.assets) primaryAsset = findAssets(p.assets, AssetType.Image, ['thumbnail', 'primary'])[0]?.location;
            return p.thumbnail || primaryAsset || '/assets/performance-placeholder.jpeg';
          },
          accessor: p => p.name
        },
        {
          label: $localize`Schedule`,
          accessor: p => {
            return `${i18n.date(unix(p.publicity_period.start), this.locale, 'short', 'short')} - ${i18n.date(
              unix(p.publicity_period.end),
              this.locale,
              'short',
              'short'
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
        function: performance => this.appService.navigateTo(`/dashboard/performances/${performance.__data._id}`)
      }
    });
  }

  openCreatePerformanceDialog() {
    this.helperService.showDialog(
      this.dialog.open(CreatePerformanceComponent, { data: { host_id: this.host._id }, width: '600px' })
    );
  }
}

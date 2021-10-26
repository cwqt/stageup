import { AppService } from 'apps/frontend/src/app/services/app.service';
import { HostService } from '@frontend/services/host.service';
import { IPerformanceStub, AssetType } from '@core/interfaces';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { CreatePerformanceComponent } from './../../routes/host/host-performances/create-performance/create-performance.component';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '@frontend/services/helper.service';
import { Component, OnInit, LOCALE_ID, Inject } from '@angular/core';
import { i18n, unix, findAssets } from '@core/helpers';

@Component({
  selector: 'app-table-box',
  templateUrl: './table-box.component.html',
  styleUrls: ['./table-box.component.scss']
})
export class TableBoxComponent implements OnInit {
  hostId = 't5tdvtnXO9q';
  table: UiTable<IPerformanceStub>;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private helperService: HelperService,
    private hostService: HostService,
    private dialog: MatDialog,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.table = new UiTable<IPerformanceStub>({
      resolver: query => this.hostService.readHostPerformances(this.hostId, query),
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
      this.dialog.open(CreatePerformanceComponent, { data: { host_id: this.hostId }, width: '600px' })
    );
  }
}

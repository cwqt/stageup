import { Component, LOCALE_ID, OnInit, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { CreatePerformanceComponent } from './create-performance/create-performance.component';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IEnvelopedData, IPerformanceStub, IPerformance, PerformanceStatus } from '@core/interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { ThemeKind } from '../../../ui-lib/ui-lib.interfaces';
import { PerformanceService } from '../../../services/performance.service';
import { UiDialogButton } from '../../../ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { i18n, richtext, unix } from '@core/helpers';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { environment } from 'apps/frontend/src/environments/environment';
import { ChipComponent } from '@frontend/ui-lib/chip/chip.component';
import { PerformanceStatusPipe } from '@frontend/_pipes/performance-status.pipe';

@Component({
  selector: 'app-host-performances',
  templateUrl: './host-performances.component.html',
  styleUrls: ['./host-performances.component.scss']
})
export class HostPerformancesComponent implements OnInit {
  hostId: string;
  table: UiTable<IPerformanceStub>;

  // displayedColumns: string[] = ['name', 'desc', 'creation', 'performance_page'];

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private performanceService: PerformanceService,
    private hostService: HostService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private appService: BaseAppService
  ) {}

  async ngOnInit() {
    this.hostId = this.hostService.currentHostValue._id;
    const statusPipe = new PerformanceStatusPipe();
    this.table = new UiTable<IPerformanceStub>({
      resolver: query => this.hostService.readHostPerformances(this.hostId, query),
      columns: [
        {
          label: $localize`Name`,
          accessor: p => p.name
        },
        {
          label: $localize`Description`,
          accessor: p => richtext.read(p.description)
        },
        {
          label: $localize`Created At`,
          accessor: p => i18n.date(unix(p.created_at), this.locale)
        },
        {
          label: $localize`Status`,
          accessor: p => statusPipe.transform(p.status),
          chip_selector: p => {
            const colours: { [index in PerformanceStatus]: ChipComponent['kind'] } = {
              [PerformanceStatus.Complete]: 'purple',
              [PerformanceStatus.Cancelled]: 'gray',
              [PerformanceStatus.Deleted]: 'gray',
              [PerformanceStatus.Live]: 'red',
              [PerformanceStatus.PendingSchedule]: 'blue',
              [PerformanceStatus.Scheduled]: 'green'
            };

            return colours[p.status];
          }
        }
      ],
      actions: [
        {
          label: $localize`Edit`,
          click: p => this.appService.navigateTo(`/dashboard/performances/${p._id}`),
          icon: 'maximize'
        }
      ],
      pagination: {}
    });
  }

  ngAfterViewInit() {}

  openCreatePerformanceDialog() {
    this.helperService.showDialog(
      this.dialog.open(CreatePerformanceComponent, { data: { host_id: this.hostId }, width: '600px' })
    );
  }

  parse(text: string) {
    return richtext.read(text);
  }

  // deletePerformance(performance: IPerformanceStub) {
  //   this.helperService.showConfirmationDialog(this.dialog, {
  //     title: $localize`Delete '${performance.name}'`,
  //     description: $localize`Are you sure you want to delete this performance?`,
  //     buttons: [
  //       new UiDialogButton({
  //         label: $localize`Cancel`,
  //         kind: ThemeKind.Secondary,
  //         callback: r => r.close()
  //       }),
  //       new UiDialogButton({
  //         label: $localize`Delete`,
  //         kind: ThemeKind.Primary,
  //         callback: r => {
  //           this.performanceService.deletePerformance(performance._id);
  //           r.close();
  //         }
  //       })
  //     ]
  //   });
  // }
}

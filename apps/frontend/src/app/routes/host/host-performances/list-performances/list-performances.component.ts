import { Component, LOCALE_ID, OnInit, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { CreatePerformanceComponent } from '../create-performance/create-performance.component';
import { AppService } from 'apps/frontend/src/app/services/app.service';
import { IPerformanceStub, PerformanceStatus } from '@core/interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { i18n, richtext, unix } from '@core/helpers';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { ChipComponent } from '@frontend/ui-lib/chip/chip.component';
import { PerformanceStatusPipe } from '@frontend/_pipes/performance-status.pipe';
import { VisibilityPipe } from '@frontend/_pipes/visibility.pipe';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-host-list-performances',
  templateUrl: './list-performances.component.html',
  styleUrls: ['./list-performances.component.scss']
})
export class HostListPerformancesComponent implements OnInit {
  hostId: string;
  table: UiTable<IPerformanceStub>;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private hostService: HostService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private appService: AppService
  ) { }

  async ngOnInit() {
    this.hostId = this.hostService.currentHostValue._id;
    const statusPipe = new PerformanceStatusPipe();
    const visibilityPipe = new VisibilityPipe();
    const datePipe = new DatePipe(this.locale);
    this.table = new UiTable<IPerformanceStub>({
      resolver: query => this.hostService.readHostPerformances(this.hostId, query),
      columns: [
        {
          label: $localize`Name`,
          accessor: p => p.name || '-'
        },
        {
          label: $localize`Event Schedule Start`,
          accessor: p => (p.publicity_period.start ? i18n.date(unix(p.publicity_period.start), this.locale) : '-')
        },
        {
          label: $localize`Event Schedule End`,
          accessor: p => (p.publicity_period.end ? i18n.date(unix(p.publicity_period.end), this.locale) : '-')
        },
        {
          label: $localize`Visibility`,
          accessor: p => visibilityPipe.transform(p.visibility)
        },
        {
          label: $localize`Created At`,
          accessor: p => i18n.date(unix(p.created_at), this.locale)
        },
        {
          label: $localize`Status`,
          accessor: p => statusPipe.transform(p.status),
          chip_selector: p => {
            const colors: { [index in PerformanceStatus]: ChipComponent['kind'] } = {
              [PerformanceStatus.Complete]: 'purple',
              [PerformanceStatus.Cancelled]: 'magenta',
              [PerformanceStatus.Deleted]: 'gray',
              [PerformanceStatus.Live]: 'red',
              [PerformanceStatus.PendingSchedule]: 'blue',
              [PerformanceStatus.Scheduled]: 'green',
              [PerformanceStatus.Draft]: 'cool-grey'
            };

            return colors[p.status];
          }
        }
      ],
      actions: [
        {
          label: $localize`Edit`,
          click: p => this.appService.navigateTo(`/dashboard/events/${p._id}`),
          icon: 'maximize',
          disabled: p => p.status == PerformanceStatus.Deleted
        }
      ],
      pagination: {}
    });
  }

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

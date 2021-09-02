import { Component, LOCALE_ID, OnInit, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { CreatePerformanceComponent } from './create-performance/create-performance.component';
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
    private hostService: HostService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private appService: AppService
  ) {}

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
          accessor: p => p.name
        },
        {
          label: $localize`Performance Schedule Start`,
          accessor: p => i18n.date(unix(p.publicity_period.start), this.locale)
        },
        {
          label: $localize`Performance Schedule End`,
          accessor: p => i18n.date(unix(p.publicity_period.end), this.locale)
        },
        {
          label: $localize`Description`,
          accessor: p => richtext.read(p.description)
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

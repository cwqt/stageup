import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { CreatePerformanceComponent } from './create-performance/create-performance.component';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IEnvelopedData, IPerformanceStub, IPerformance } from '@core/interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { ThemeKind } from '../../../ui-lib/ui-lib.interfaces';
import { PerformanceService } from '../../../services/performance.service';

@Component({
  selector: 'app-host-performances',
  templateUrl: './host-performances.component.html',
  styleUrls: ['./host-performances.component.scss']
})
export class HostPerformancesComponent implements OnInit {
  hostId: string;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  hostPerformancesDataSrc: MatTableDataSource<IPerformanceStub>;
  displayedColumns: string[] = ['name', 'desc', 'creation', 'performance_page'];
  performances: ICacheable<IEnvelopedData<IPerformanceStub[], null>> = {
    data: null,
    loading: false,
    error: ''
  };

  constructor(
    private performanceService: PerformanceService,
    private hostService: HostService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private appService: BaseAppService
  ) {}

  get pager(): MatPaginator {
    return this.hostPerformancesDataSrc.paginator;
  }

  async ngOnInit() {
    this.hostId = this.hostService.currentHostValue._id;
    this.hostPerformancesDataSrc = new MatTableDataSource<IPerformanceStub>([]);
    this.getHostPerformancesList();
  }

  ngAfterViewInit() {
    this.hostPerformancesDataSrc.paginator = this.paginator;
  }

  openCreatePerformanceDialog() {
    this.helperService.showDialog(
      this.dialog.open(CreatePerformanceComponent, { data: { host_id: this.hostId }, width: '600px' }),
      (perf: IPerformance | null) => {
        // TODO: push to performances list outside
      }
    );
  }

  async getHostPerformancesList() {
    this.performances.loading = true;
    return this.hostService
      .readHostPerformances(this.hostId, this.pager?.pageIndex, this.pager?.pageSize)
      .then(hd => {
        this.performances.data = hd;
        this.hostPerformancesDataSrc.data = hd.data;
        if (this.pager) {
          this.pager.length = hd.__paging_data.total;
        }
      })

      .catch(e => (this.performances.error = e))
      .finally(() => (this.performances.loading = false));
  }

  openPerformance(performances: IPerformance) {
    this.appService.navigateTo(`/dashboard/performances/${performances._id}`);
  }

  deletePerformance(performance: IPerformanceStub) {
    this.helperService.showConfirmationDialog(this.dialog, {
      title: `Delete '${performance.name}'`,
      description: 'Are you sure you want to delete this performance?',
      buttons: [
        {
          text: 'Cancel',
          kind: ThemeKind.Secondary,
          callback: r => r.close()
        },
        {
          text: 'Delete',
          kind: ThemeKind.Primary,
          callback: r => {
            this.performanceService.deletePerformance(performance._id);
            r.close();
          }
        }
      ]
    });
  }
}

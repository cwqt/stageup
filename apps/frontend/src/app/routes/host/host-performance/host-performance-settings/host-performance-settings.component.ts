import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DtoPerformance, IHost, IPerformanceHostInfo } from '@core/interfaces';
import { ICacheable } from '@frontend/app.interfaces';
import { PerformanceDeleteDialogComponent } from '@frontend/routes/performance/performance-delete-dialog/performance-delete-dialog.component';

@Component({
  selector: 'app-host-performance-settings',
  templateUrl: './host-performance-settings.component.html',
  styleUrls: ['./host-performance-settings.component.scss']
})
export class HostPerformanceSettingsComponent implements OnInit {
  // Injected from parent router outlet
  host: IHost;
  performanceId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: ICacheable<DtoPerformance>;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  deletePerformance() {
    this.dialog.open(PerformanceDeleteDialogComponent, {
      data: this.performance.data.data
    });
  }
}
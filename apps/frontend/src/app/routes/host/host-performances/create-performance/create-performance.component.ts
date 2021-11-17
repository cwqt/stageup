import { HostService } from '@frontend/services/host.service';
import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PerformanceType } from '@core/interfaces';
import { AppService } from 'apps/frontend/src/app/services/app.service';
import { IUiDialogOptions } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-create-performance',
  templateUrl: './create-performance.component.html',
  styleUrls: ['./create-performance.component.scss']
})
export class CreatePerformanceComponent implements OnInit, IUiDialogOptions {
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();
  loading: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { host_id: string },
    private ref: MatDialogRef<CreatePerformanceComponent>,
    private hostService: HostService,
    private appService: AppService
  ) {}

  async selectType(type: 'live' | 'vod') {
    this.loading = true;
    const performance = await this.hostService.createPerformance(
      this.hostService.hostId,
      type === 'live' ? PerformanceType.Live : PerformanceType.Vod
    );
    this.ref.close();
    this.loading = false;
    this.appService.navigateTo(`/dashboard/performances/${performance._id}`);
  }

  ngOnInit(): void {}
}

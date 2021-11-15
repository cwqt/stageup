import { HostService } from '@frontend/services/host.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PerformanceType } from '@core/interfaces';
import { AppService } from 'apps/frontend/src/app/services/app.service';

@Component({
  selector: 'app-create-performance',
  templateUrl: './create-performance.component.html',
  styleUrls: ['./create-performance.component.scss']
})
export class CreatePerformanceComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { host_id: string },
    private ref: MatDialogRef<CreatePerformanceComponent>,
    private hostService: HostService,
    private appService: AppService
  ) {}

  async setType(type: 'live' | 'vod') {
    const performance = await this.hostService.createPerformance(
      this.hostService.hostId,
      type === 'live' ? PerformanceType.Live : PerformanceType.Vod
    );
    this.ref.close();
    this.appService.navigateTo(`/dashboard/performances/${performance._id}`);
  }

  ngOnInit(): void {}
}

import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IPerformanceStub, LiveStreamState } from '@core/interfaces';
import { PerformanceBrochureComponent } from '@frontend/routes/performance/performance-brochure/performance-brochure.component';
import { HelperService } from '@frontend/services/helper.service';
@Component({
  selector: 'app-performance-thumb',
  templateUrl: './performance-thumb.component.html',
  styleUrls: ['./performance-thumb.component.scss']
})
export class PerformanceThumbComponent implements OnInit {
  @Input() performance: IPerformanceStub;

  constructor(private helperService: HelperService, private dialog: MatDialog) {}

  ngOnInit(): void {}

  openBrochure(): void {
    this.helperService.showDialog(
      this.dialog.open(PerformanceBrochureComponent, {
        data: this.performance,
        width: '1000px'
      }),
      () => {}
    );
  }
}

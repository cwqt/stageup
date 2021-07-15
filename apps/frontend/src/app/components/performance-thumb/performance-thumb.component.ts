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
  @Output() onFollowEvent = new EventEmitter();

  constructor(private helperService: HelperService, private dialog: MatDialog) {}

  ngOnInit(): void {}

  openBrochure(): void {
    // Send both the performance stub and an 'output' event emitter to the performance brochure component.
    // When a user clicks to 'follow' or 'unfollow' a host it will trigger the emitter and refresh the 'My Follows' feed.
    const envelope = { performance: this.performance, onFollowEvent: this.onFollowEvent };
    this.helperService.showDialog(
      this.dialog.open(PerformanceBrochureComponent, {
        data: envelope,
        width: '1000px'
      }),
      () => {}
    );
  }
}

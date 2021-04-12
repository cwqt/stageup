import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { IPerformanceStub, LiveStreamState } from '@core/interfaces';

@Component({
  selector: 'app-performance-thumb',
  templateUrl: './performance-thumb.component.html',
  styleUrls: ['./performance-thumb.component.scss']
})
export class PerformanceThumbComponent implements OnInit {
  @Input() performance:IPerformanceStub;
  isCurrentlyActive:boolean;

  constructor() { }

  ngOnInit(): void {
    this.isCurrentlyActive = this.performance.stream.state == LiveStreamState.Active;
  }

}

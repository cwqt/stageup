import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { IPerformanceStub } from '@core/interfaces';

@Component({
  selector: 'app-performance-thumb',
  templateUrl: './performance-thumb.component.html',
  styleUrls: ['./performance-thumb.component.scss']
})
export class PerformanceThumbComponent implements OnInit {
  @Input() performance:IPerformanceStub;

  constructor() { }

  ngOnInit(): void {
  }

}

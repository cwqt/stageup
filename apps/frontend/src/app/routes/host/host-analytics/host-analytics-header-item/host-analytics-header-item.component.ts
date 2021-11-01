import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ChartjsComponent } from '@ctrl/ngx-chartjs';
import { ChartData, ChartOptions } from 'chart.js';

export interface IHeaderItem {
  title: string;
  graph: {
    data: ChartData;
    options: ChartOptions;
  };
  aggregation?: string | number;
  difference?: number; // Percentage diggerence as a decimal (e.g. 1.2 => +120%)
}

@Component({
  selector: 'app-host-analytics-header-item',
  templateUrl: './host-analytics-header-item.component.html',
  styleUrls: ['./host-analytics-header-item.component.scss']
})
export class HostAnalyticsHeaderItemComponent implements OnInit {
  @Input() ref: string; // some way of distinguishing between charts on different analytics entities
  @Input() item: IHeaderItem;
  @Input() loading: boolean;

  @ViewChild(ChartjsComponent) chart: ChartjsComponent;

  constructor() {}

  ngOnInit(): void {
    console.log('--------------------');
    console.log(this.item);
  }

  clearGraph() {
    this.item.graph.data.datasets[0].data = [];
    this.item.graph.data.labels = [];
  }
}

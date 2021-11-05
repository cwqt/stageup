import { Component, Inject, Input, OnInit, ViewChild, AfterViewInit, LOCALE_ID } from '@angular/core';
import { Analytics, CurrencyCode, IPerformanceAnalyticsMetrics } from '@core/interfaces';
import { ChartjsComponent } from '@ctrl/ngx-chartjs';
import { ChartData, ChartOptions } from 'chart.js';

export interface IHeaderItem {
  title: string;
  graph: {
    data: ChartData;
    options: ChartOptions;
  };
  aggregation?: number;
  difference?: number; // Percentage difference as a decimal (e.g. 1.2 => +120%)
}

@Component({
  selector: 'app-host-analytics-header-item',
  templateUrl: './host-analytics-header-item.component.html',
  styleUrls: ['./host-analytics-header-item.component.scss']
})
export class HostAnalyticsHeaderItemComponent implements OnInit {
  @Input() ref: string; // some way of distinguishing between charts on different analytics entities
  @Input() item: IHeaderItem;
  @Input() type: keyof IPerformanceAnalyticsMetrics;
  @Input() loading: boolean;

  @ViewChild(ChartjsComponent) chart: ChartjsComponent;

  constructor(@Inject(LOCALE_ID) public locale: string) {}

  ngOnInit(): void {}

  clearGraph() {
    this.item.graph.data.datasets[0].data = [];
    this.item.graph.data.labels = [];
  }

  // There is no data yet for this host, if the aggregation and the difference are both equal to 0.
  get noDataYet(): boolean {
    return !this.item.difference && this.item.aggregation == 0;
  }

  get differenceIsFinite(): boolean {
    return Number.isFinite(this.item.difference);
  }

  get formattedAggregation(): string {
    return Analytics.entities.performance.formatters[this.type](this.item.aggregation, {
      locale: this.locale,
      currency: CurrencyCode.GBP
    });
  }
}

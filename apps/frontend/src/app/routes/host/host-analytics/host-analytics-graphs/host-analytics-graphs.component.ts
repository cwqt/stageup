import { ChartDataset } from 'chart.js';
import { Component, Inject, LOCALE_ID, OnInit, QueryList, ViewChildren, Output, EventEmitter } from '@angular/core';
import { unix, unixPeriod } from '@core/helpers';
import {
  Analytics,
  AnalyticsTimePeriod,
  DtoHostAnalytics,
  DtoPerformanceAnalytics,
  IHostAnalyticsMetrics,
  IPerformanceAnalyticsMetrics
} from '@core/interfaces';
import { Cacheable } from '@frontend/app.interfaces';
import { HostService } from '@frontend/services/host.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import {
  HostAnalyticsHeaderItemComponent,
  IHeaderItem
} from '../host-analytics-header-item/host-analytics-header-item.component';
import { chartData, chartOptions } from '../host-analytics-header-item/host-analytics.chartjs';

type AnalyticsSnapshot<Metrics extends IHostAnalyticsMetrics | IPerformanceAnalyticsMetrics> = {
  period_aggregate: { [index in keyof Metrics]?: Metrics[index] };
  header_items: { [index in keyof Metrics]?: IHeaderItem };
};

@Component({
  selector: 'app-host-analytics-graphs',
  templateUrl: './host-analytics-graphs.component.html',
  styleUrls: ['./host-analytics-graphs.component.scss']
})
export class HostAnalyticsGraphsComponent implements OnInit {
  @ViewChildren(HostAnalyticsHeaderItemComponent) headers: QueryList<HostAnalyticsHeaderItemComponent>;
  @Output() periodEmitter = new EventEmitter();

  constructor(@Inject(LOCALE_ID) public locale: string, private hostService: HostService) {}

  // For analytics period selector
  periodForm: UiForm<AnalyticsTimePeriod>;
  periodMap: { [index in AnalyticsTimePeriod]: string } = {
    WEEKLY: $localize`Weekly`,
    MONTHLY: $localize`Monthly`,
    QUARTERLY: $localize`Quarterly`,
    YEARLY: $localize`Yearly`
  };

  get selectedPeriod() {
    return this.periodMap[this.periodForm?.group.value.period] || '';
  }

  // For header items, snapshot of aggregate over period
  snapshot: {
    host: AnalyticsSnapshot<IHostAnalyticsMetrics>;
    performances: AnalyticsSnapshot<IPerformanceAnalyticsMetrics>;
  } = {
    host: {
      // is a single entity
      period_aggregate: {},
      header_items: {
        performances_created: this.createHeaderItem($localize`Total Events`)
      }
    },
    performances: {
      // is an aggregate over many entities
      period_aggregate: {},
      header_items: {
        total_revenue: this.createHeaderItem($localize`Ticket Revenue`),
        total_ticket_sales: this.createHeaderItem($localize`Ticket sales`),
        trailer_views: this.createHeaderItem($localize`Trailer views`)
      }
    }
  };

  get headerItems() {
    return Object.values(this.snapshot).reduce((acc, curr) => ((acc = acc.concat(curr.header_items)), acc), []);
  }

  // Host data response - single entity
  hostAnalytics = new Cacheable<DtoHostAnalytics>();
  performanceAnalytics = new Cacheable<DtoPerformanceAnalytics[]>();

  ngOnInit(): void {
    this.periodForm = new UiForm({
      fields: {
        period: UiField.Select({
          initial: 'MONTHLY',
          values: new Map(Object.entries(this.periodMap).map(([key, value]) => [key, { label: value }])),
          appearance: 'outline'
        })
      },
      handlers: {
        changes: async v => {
          this.periodEmitter.emit(v.value.period);
          this.readHostAnalytics();
          this.readPerformanceAnalytics();
        }
      },
      resolvers: {
        output: async v => v.period
      }
    });

    // Get the host analytics and performance analytics on component init
    this.readHostAnalytics();
    this.readPerformanceAnalytics();
  }

  getPercentageDifference(a: number, b: number): number {
    return Math.floor(a - b) / b;
  }

  // Give empty skeleton for setup
  createHeaderItem(title: string): IHeaderItem {
    return {
      title: title,
      graph: {
        data: { labels: [], datasets: [{ data: [], ...chartData }] },
        options: chartOptions
      },
      aggregation: 0
    };
  }

  async readHostAnalytics() {
    const dto = await this.hostAnalytics.request(
      this.hostService.readHostAnalytics(this.hostService.currentHostValue._id, this.periodForm.group.value.period)
    );
    // Every time data is refetched, must refresh the chart - in the same way performances are done with its resolutionSuccess
    const properties = Object.keys(this.snapshot.host.header_items) as (keyof IHostAnalyticsMetrics)[];
    // Clear all host graphs of data
    const headers = this.headers.filter(header => header.ref == 'host'); // only host related charts
    headers?.forEach(headers => headers.clearGraph());

    // Get the index of separation between the current and previous periods
    const periodCutOff = Analytics.offsets[this.periodForm.group.value.period];

    // Chunks are already in reverse chronological order. The first slice is the current period, the second slice is the previous period
    const [latest, previous] = [
      Analytics.entities.host.aggregators.metrics(dto.chunks.slice(0, periodCutOff).map(dto => dto.metrics)),
      Analytics.entities.host.aggregators.metrics(
        dto.chunks.slice(periodCutOff, dto.chunks.length).map(dto => dto.metrics)
      )
    ];

    // Sort in chronological order to display in the graph
    dto.chunks = dto.chunks.sort((a, b) => a.period_ended_at - b.period_ended_at);

    properties.forEach(property => {
      // Set difference percentage
      this.snapshot.host.header_items[property].difference = this.getPercentageDifference(
        latest[property],
        previous[property]
      );

      this.setChartColor(
        this.snapshot.host.header_items[property].difference,
        this.snapshot.host.header_items[property].graph.data.datasets[0]
      );

      // Pretty format the aggregate value for the header item using the analytics formatters
      this.snapshot.host.header_items[property].aggregation = latest[property];
      // Populate charts with data for this property
      dto.chunks.forEach(chunk => {
        this.snapshot.host.header_items[property].graph.data.datasets[0].data.push(chunk.metrics[property]);
        this.snapshot.host.header_items[property].graph.data.labels.push(unix(chunk.period_ended_at));
      });
    });
    headers?.forEach(header => header.chart?.chartInstance.update());
  }

  async readPerformanceAnalytics(): Promise<void> {
    const dto = await this.performanceAnalytics.request(
      this.hostService.readAllPerformancesAnalytics(
        this.hostService.currentHostValue._id,
        this.periodForm.group.value.period
      )
    );

    const performancePeriods = dto.map(dto => {
      const periodCutOff = Analytics.offsets[this.periodForm.group.value.period];

      const [latest, previous] = [dto.chunks.slice(0, periodCutOff), dto.chunks.slice(periodCutOff, dto.chunks.length)];
      return {
        ...dto,
        snapshot: {
          latest_period: Analytics.entities.performance.aggregators.chunks(latest),
          previous_period: Analytics.entities.performance.aggregators.chunks(previous)
        }
      };
    });

    const properties = Object.keys(this.snapshot.performances.header_items) as (keyof IPerformanceAnalyticsMetrics)[];
    // Clear graphs of old data
    const headers = this.headers.filter(header => header.ref == 'performances'); // only perf related charts
    headers?.forEach(headers => headers.clearGraph());

    const allPerformanceChunks = performancePeriods
      .flatMap(dto => dto.chunks)
      .sort((a, b) => a.period_ended_at - b.period_ended_at);

    const metricAggregateByPeriod = {
      latest_period: Analytics.entities.performance.aggregators.metrics(
        performancePeriods.map(row => row.snapshot.latest_period.metrics)
      ),
      previous_period: Analytics.entities.performance.aggregators.metrics(
        performancePeriods.map(row => row.snapshot.previous_period.metrics)
      )
    };

    properties.forEach(property => {
      const { latest_period: latest, previous_period: previous } = metricAggregateByPeriod;

      this.snapshot.performances.header_items[property].difference = this.getPercentageDifference(
        latest[property],
        previous[property]
      );

      this.setChartColor(
        this.snapshot.performances.header_items[property].difference,
        this.snapshot.performances.header_items[property].graph.data.datasets[0]
      );
      this.snapshot.performances.header_items[property].aggregation = latest[property];

      const oneWeek = unixPeriod('week');
      // The most recent data point (which we can use to base all other aggregation periods off)
      let currentPeriodEnd = allPerformanceChunks[allPerformanceChunks.length - 1].period_ended_at;
      let currentPeriodStart = currentPeriodEnd - oneWeek;
      // Aggregate all data into one week periods going backwards, based off the most recent data point
      // Each graph will have aggregation periods that equal the number of weeks +1 (e.g. 'Weekly' periods will have 2 data points - i.e. a straight line)
      for (let i = 0; i < Analytics.offsets[this.periodForm.group.value.period] + 1; i++) {
        // Identify performances within this time period
        const thisPeriodData = allPerformanceChunks.filter(
          performance =>
            performance.period_ended_at > currentPeriodStart && performance.period_ended_at <= currentPeriodEnd
        );
        // Aggregate the data for all performances in this period
        const aggregation = thisPeriodData.reduce((prev, current) => {
          return prev + current.metrics[property];
        }, 0);
        // And add to he graph data
        this.snapshot.performances.header_items[property].graph.data.datasets[0].data.unshift(aggregation);
        this.snapshot.performances.header_items[property].graph.data.labels.unshift(unix(currentPeriodEnd));
        currentPeriodEnd = currentPeriodStart;
        currentPeriodStart = currentPeriodStart - oneWeek;
      }
    });
    headers?.forEach(header => header.chart?.chartInstance.update());
  }

  setChartColor(difference: number, graph: ChartDataset): void {
    const graphColor = difference < 0 ? '#E97B86' : difference > 0 ? '#96d0a3' : '#30a2b8';
    graph.borderColor = graphColor;
    graph.backgroundColor = graphColor;
  }
}

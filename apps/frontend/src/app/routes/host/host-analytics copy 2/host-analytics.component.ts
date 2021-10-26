import { Component, Inject, LOCALE_ID, OnInit, QueryList, ViewChildren } from '@angular/core';
import { i18n, unix } from '@core/helpers';
import {
  Analytics,
  AnalyticsPeriodDifference,
  AnalyticsTimePeriod,
  AssetType,
  CurrencyCode,
  DtoHostAnalytics,
  DtoPerformanceAnalytics,
  IHostAnalyticsMetrics,
  IPerformanceAnalyticsMetrics
} from '@core/interfaces';
import { Cacheable } from '@frontend/app.interfaces';
import { HostService } from '@frontend/services/host.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import {
  HostAnalyticsHeaderItemComponent,
  IHeaderItem
} from './host-analytics-header-item/host-analytics-header-item.component';
import { chartData, chartOptions } from './host-analytics-header-item/host-analytics.chartjs';

/**
 * name: string
 * chunks: [chunk, chunk, chunk]
 * snapshot: {
 *  latest_period: chunk,     // snapshot.latest_period is analytics.latest_period aggregated
 *  previous_period: chunk    // same for snapshot.previous_period
 * }
 */
type PerformanceAnalyticsRowData = DtoPerformanceAnalytics & {
  snapshot: AnalyticsPeriodDifference<IPerformanceAnalyticsMetrics, true>;
};

type AnalyticsSnapshot<Metrics extends IHostAnalyticsMetrics | IPerformanceAnalyticsMetrics> = {
  period_aggregate: { [index in keyof Metrics]?: Metrics[index] };
  header_items: { [index in keyof Metrics]?: IHeaderItem };
};

@Component({
  selector: 'app-host-analytics',
  templateUrl: './host-analytics.component.html',
  styleUrls: ['./host-analytics.component.scss']
})
export class HostAnalyticsComponent implements OnInit {
  @ViewChildren(HostAnalyticsHeaderItemComponent) headers: QueryList<HostAnalyticsHeaderItemComponent>;

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
        performances_created: this.createHeaderItem($localize`Performances created`)
      }
    },
    performances: {
      // is an aggregate over many entities
      period_aggregate: {},
      header_items: {
        total_revenue: this.createHeaderItem($localize`Revenue`),
        total_ticket_sales: this.createHeaderItem($localize`Ticket sales`),
        trailer_views: this.createHeaderItem($localize`Trailer views`)
      }
    }
  };

  get headerItems() {
    return Object.values(this.snapshot).reduce((acc, curr) => ((acc = acc.concat(curr.header_items)), acc), []);
  }

  // Each performance has is a row of IPerformanceStub & Metrics[]
  // however each row needs to display its aggregation of all Metrics[]
  performanceAnalyticsTable: UiTable<PerformanceAnalyticsRowData>;

  // Host data response - single entity
  hostAnalytics = new Cacheable<DtoHostAnalytics>();

  ngOnInit(): void {
    this.periodForm = new UiForm({
      fields: {
        period: UiField.Select({
          initial: 'MONTHLY',
          values: new Map(Object.entries(this.periodMap).map(([key, value]) => [key, { label: value }]))
        })
      },
      handlers: {
        changes: async v => {
          this.performanceAnalyticsTable.refresh();
          this.readHostAnalytics();
        }
      },
      resolvers: {
        output: async v => v.period
      }
    });

    // Get the host analytics on component init
    this.readHostAnalytics();
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

    dto.chunks = dto.chunks.sort((a, b) => (a.period_ended_at < b.period_ended_at ? -1 : 1));

    // Get the two periods as aggregated sums for each period
    const half = Math.ceil(dto.chunks.length / 2);
    const [previous, latest] = [
      Analytics.entities.host.aggregators.metrics(dto.chunks.slice(0, half).map(dto => dto.metrics)),
      Analytics.entities.host.aggregators.metrics(dto.chunks.slice(half, dto.chunks.length).map(dto => dto.metrics))
    ];

    properties.forEach(property => {
      // Set difference percentage
      this.snapshot.host.header_items[property].difference = this.formatPercentageDifference(
        latest[property],
        previous[property]
      );

      // Pretty format the aggregate value for the header item using the analytics formatters
      this.snapshot.host.header_items[property].aggregation = Analytics.entities.host.formatters[property](
        latest[property],
        {
          locale: this.locale,
          currency: CurrencyCode.GBP
        }
      );

      // Populate charts with data for this property
      dto.chunks.forEach(chunk => {
        this.snapshot.host.header_items[property].graph.data.datasets[0].data.push(chunk.metrics[property]);
        this.snapshot.host.header_items[property].graph.data.labels.push(unix(chunk.period_ended_at));
      });
    });

    headers?.forEach(header => header.chart.chartInstance.update());
  }

  formatPercentageDifference(a: number, b: number): string {
    // Calculate the difference between now & before for this property
    const diff = Math.floor(100 * Math.abs((a - b) / ((a + b) / 2)));

    // Format as a +ve or -ve % for the header item
    return `${a >= b ? '' : '-'}${isNaN(diff) ? 0 : diff}%`;
  }

  // Give empty skeleton for setup
  createHeaderItem(title: string): IHeaderItem {
    return {
      title: title,
      graph: {
        data: { labels: [], datasets: [{ data: [], ...chartData }] },
        options: chartOptions
      },
      aggregation: ''
    };
  }
}

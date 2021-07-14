import { Component, Inject, LOCALE_ID, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { i18n, unix } from '@core/helpers';
import {
  CurrencyCode,
  AnalyticsTimePeriod,
  DtoPerformanceAnalytics,
  AssetType,
  AssetTags,
  IPerformanceAnalyticsMetrics,
  IEnvelopedData,
  IPerformanceStub
} from '@core/interfaces';
import { cachize } from '@frontend/app.interfaces';
import { HostService } from '@frontend/services/host.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { ChartArea, ChartData, ChartDataset, ChartOptions, Color, ScriptableContext } from 'chart.js';
import { Except } from 'type-fest';
import { PerformanceAnalyticsMethods } from '@core/interfaces';

import { chartData, chartOptions, bgColorGradientFn } from './host-analytics.chartjs';
import { ChartjsComponent } from '@ctrl/ngx-chartjs';

interface IHeaderItem {
  title: string;
  graph: {
    data: ChartData;
    options: ChartOptions;
  };
  aggregation?: string | number;
  difference?: string; // e.g. 10%
}

type AnalyticsRowData = IPerformanceStub & { metrics: IPerformanceAnalyticsMetrics };

@Component({
  selector: 'frontend-host-analytics',
  templateUrl: './host-analytics.component.html',
  styleUrls: ['./host-analytics.component.scss']
})
export class HostAnalyticsComponent implements OnInit {
  constructor(@Inject(LOCALE_ID) public locale: string, private hostService: HostService) {}

  @ViewChildren(ChartjsComponent) charts: QueryList<ChartjsComponent>;

  // For analytics period selector
  periodForm: UiForm<AnalyticsTimePeriod>;
  periodMap: { [index in AnalyticsTimePeriod]: string } = {
    WEEKLY: $localize`Weekly`,
    MONTHLY: $localize`Monthly`,
    QUARTERLY: $localize`Quarterly`,
    YEARLY: $localize`Yearly`
  };

  // Raw API response
  analytics: IEnvelopedData<DtoPerformanceAnalytics[]>;
  analyticsTable: UiTable<AnalyticsRowData>;
  // Weekly chunks summed into an aggregation for comparions purposes
  analyticsAggregates: {
    [performanceId: string]: {
      [index in keyof DtoPerformanceAnalytics['analytics'] as `${index}_metrics`]: IPerformanceAnalyticsMetrics;
    };
  } = {};

  // The big graph-y things at the top...the name sucks i know
  headerItems: { [index in keyof IPerformanceAnalyticsMetrics]?: IHeaderItem } = {
    total_ticket_sales: this.createHeaderItem($localize`Ticket sales`),
    total_revenue: this.createHeaderItem($localize`Revenue`),
    trailer_views: this.createHeaderItem($localize`Trailer Views`)
  };

  get selectedPeriod() {
    return this.periodMap[this.periodForm?.group.value.period] || '';
  }

  ngOnInit(): void {
    this.periodForm = new UiForm({
      fields: {
        period: UiField.Select({
          initial: 'MONTHLY',
          values: new Map(Object.entries(this.periodMap).map(([key, value]) => [key, { label: value }]))
        })
      },
      handlers: {
        changes: async v => this.analyticsTable.refresh()
      },
      resolvers: {
        output: async v => v.period
      }
    });

    this.analyticsTable = new UiTable<AnalyticsRowData>({
      actions: [],
      resolver: async q => {
        // Get all the performances weekly collected analytics data
        this.analytics = await this.hostService.readPerformancesAnalytics(
          this.hostService.currentHostValue._id,
          this.periodForm.group.value.period,
          q
        );


        // Aggregate all weekly chunks into a single metrics object spanning the entire selected duration
        this.analytics.data.forEach(performance => {
          this.analyticsAggregates[performance._id] = {
            latest_period_metrics: PerformanceAnalyticsMethods.aggregate(
              performance.analytics.latest_period.map(p => p.metrics)
            ),
            previous_period_metrics: PerformanceAnalyticsMethods.aggregate(
              performance.analytics.previous_period.map(p => p.metrics)
            )
          };
        });

        // Reduce into something nice for the table columns to consume
        return {
          __client_data: this.analytics.__client_data,
          __paging_data: this.analytics.__paging_data,
          data: this.analytics.data.reduce<AnalyticsRowData[]>((acc, curr) => {
            acc.push({ ...curr, metrics: this.analyticsAggregates[curr._id].latest_period_metrics });
            return acc;
          }, [])
        };
      },
      pagination: {},
      columns: [
        {
          label: $localize`Performance`,
          accessor: v => v.name,
          image: v => v.assets.find(a => a.type == AssetType.Image && a.tags.includes('secondary')).location
        },
        {
          label: $localize`Premiere Date`,
          accessor: v => i18n.date(unix(v.premiere_datetime), this.locale)
        },
        // {
        //   label: $localize`Expiry Date`,
        //   accessor: v => 0
        // },
        {
          label: $localize`Tickets sold`,
          accessor: v => v.metrics.total_ticket_sales.toLocaleString()
        },
        {
          label: $localize`Revenue`,
          accessor: v => i18n.money(v.metrics.total_revenue, CurrencyCode.GBP)
        },
        {
          label: $localize`Average Watch %`,
          accessor: v => `${v.metrics.average_watch_percentage}`
        },
        {
          label: $localize`Trailer Views`,
          accessor: v => v.metrics.trailer_views.toLocaleString()
        }
      ]
    });

    // Refresh the graphs every time the data is resolved
    this.analyticsTable.resolutionSuccess.subscribe(rows => {
      const properties = Object.keys(this.headerItems) as (keyof IPerformanceAnalyticsMetrics)[];


      // Clear graph of old data
      properties.forEach(property => {
        this.headerItems[property].graph.data.datasets[0].data = [];
        this.headerItems[property].graph.data.labels = [];
      });

      // Perform aggregation for all performances, across both periods, for comparison
      // e.g. month 1 vs month 2 12% decrease
      const [latest, previous] = ['latest_period', 'previous_period'].map(period => {
        // Create an object with all the properties needed for each header item, all starting at zero
        const aggregate: { [index in keyof IPerformanceAnalyticsMetrics]?: number } = properties.reduce(
          (acc, curr) => ((acc[curr] = 0), acc),
          {}
        );

        // Aggregate across all performances
        for (let performance of rows) {
          const dto = this.analytics.data.find(p => p._id == performance._id);
          console.log('chunks:', dto.analytics[period].length);

          // Aggregate across all weekly chunks
          for (let property of properties) {
            let chunk = dto.analytics[period].reduce((acc, curr) => (acc += curr.metrics[property] as number), 0);

            // For percentage, divide accumulation by number of chunks
            if (property == 'average_watch_percentage') chunk = chunk / dto.analytics[period].length;

            // Add chunk aggregate to total aggregate over all performances
            aggregate[property] += chunk;
          }

          // For percentage, divide aggregated chunks by number of performances
          if (aggregate.average_watch_percentage) {
            aggregate.average_watch_percentage = aggregate.average_watch_percentage / rows.length;
          }
        }

        return aggregate;
      });

      console.log(latest, previous);

      // Set the difference/aggregate values for each header item property
      properties.forEach(property => {
        // Calculate relative percentage difference between latest & previous aggregate for property
        const diff = Math.floor(
          100 * Math.abs((previous[property] - latest[property]) / ((previous[property] + latest[property]) / 2))
        );

        this.headerItems[property].difference = `${latest[property] <= previous[property] ? '' : '-'}${
          isNaN(diff) ? 0 : diff
        }%`;

        // Use the formatters to get pretty strings!
        this.headerItems[property].aggregation = PerformanceAnalyticsMethods.formatters[property](latest[property], {
          locale: this.locale,
          currency: CurrencyCode.GBP
        });
      });

      // Redraw all charts with new data
      // Extract out all metrics taken into a big array, sorted by period
      const x = rows
        .map(row => this.analytics.data.find(p => p._id == row._id)) // get all dtos
        .map(dto => Object.values(dto.analytics).flat()) // get latest/previous
        .flat() // combine latest/previous
        .sort((a, b) => (a.period_end < b.period_end ? 1 : -1)) // sort by date, oldest -> newest
        .forEach(period =>
          properties.forEach(property => {
            this.headerItems[property].graph.data.datasets[0].data.push(period.metrics[property]);
            this.headerItems[property].graph.data.labels.push(unix(period.period_end));
          })
        );

      this.charts?.forEach(chart => chart.chartInstance.update());
    });
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

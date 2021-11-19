import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { i18n, unix } from '@core/helpers';
import {
  Analytics,
  AnalyticsPeriodDifference,
  AnalyticsTimePeriod,
  AssetType,
  CurrencyCode,
  DtoHostAnalytics,
  DtoPerformanceAnalytics,
  IPerformanceAnalyticsMetrics
} from '@core/interfaces';
import { Cacheable } from '@frontend/app.interfaces';
import { HostService } from '@frontend/services/host.service';
import { UiTable } from '@frontend/ui-lib/table/table.class';

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

@Component({
  selector: 'app-host-analytics',
  templateUrl: './host-analytics.component.html',
  styleUrls: ['./host-analytics.component.scss']
})
export class HostAnalyticsComponent implements OnInit {
  selectedPeriod = 'MONTHLY' as AnalyticsTimePeriod;
  performanceAnalyticsTable: UiTable<PerformanceAnalyticsRowData>;
  hostAnalytics = new Cacheable<DtoHostAnalytics>();

  constructor(@Inject(LOCALE_ID) public locale: string, private hostService: HostService) {}

  ngOnInit(): void {
    this.performanceAnalyticsTable = new UiTable<PerformanceAnalyticsRowData>({
      actions: [],
      resolver: async q => {
        // Get all the performances weekly collected analytics data
        const res = await this.hostService.readPerformancesAnalytics(
          this.hostService.currentHostValue._id,
          this.selectedPeriod,
          q
        );

        return {
          __client_data: res.__client_data,
          __paging_data: res.__paging_data,
          data: res.data.map(dto => {
            const half = Math.ceil(dto.chunks.length / 2);
            const [latest, previous] = [dto.chunks.slice(0, half), dto.chunks.slice(half, dto.chunks.length)];

            return {
              ...dto,
              snapshot: {
                latest_period: Analytics.entities.performance.aggregators.chunks(latest),
                previous_period: Analytics.entities.performance.aggregators.chunks(previous)
              }
            };
          })
        };
      },
      pagination: {},
      columns: [
        {
          label: $localize`Performance`,
          accessor: v => v.name,
          image: v =>
            v.assets?.find(a => a.type == AssetType.Image && a.tags.includes('secondary'))?.location ||
            '/assets/performance-placeholder.jpeg'
        },
        {
          label: $localize`Premiere Date`,
          accessor: v => i18n.date(unix(v.publicity_period.start), this.locale)
        },
        {
          label: $localize`Tickets sold`,
          accessor: v => v.snapshot.latest_period.metrics.total_ticket_sales.toLocaleString()
        },
        {
          label: $localize`Revenue`,
          accessor: v => i18n.money(v.snapshot.latest_period.metrics.total_revenue, CurrencyCode.GBP)
        },
        {
          label: $localize`Performance Views`,
          accessor: v => `${v.snapshot.latest_period.metrics.performance_views.toLocaleString()}`
        },
        {
          label: $localize`Trailer Views`,
          accessor: v => v.snapshot.latest_period.metrics.trailer_views.toLocaleString()
        }
      ]
    });
  }

  refreshTable(period: AnalyticsTimePeriod): void {
    this.selectedPeriod = period;
    this.performanceAnalyticsTable.refresh();
  }
}

import { Component, Inject, LOCALE_ID, OnInit, QueryList, ViewChildren, Output, Input, EventEmitter } from '@angular/core';
import { unix } from '@core/helpers';
import {
    Analytics,
    DtoHostAnalytics,
    DtoPerformanceAnalytics,
    IHostAnalyticsMetrics,
    IPerformanceAnalyticsMetrics
} from '@core/interfaces';
import { Cacheable } from '@frontend/app.interfaces';
import { HostService } from '@frontend/services/host.service';
import {
    HostAnalyticsHeaderItemComponent,
    IHeaderItem
} from '../host-analytics-header-item/host-analytics-header-item.component';
import { HostAnalyticsGraphsComponent } from '../host-analytics-graphs/host-analytics-graphs.component';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';

type AnalyticsSnapshot<Metrics extends IHostAnalyticsMetrics | IPerformanceAnalyticsMetrics> = {
    period_aggregate: { [index in keyof Metrics]?: Metrics[index] };
    header_items: { [index in keyof Metrics]?: IHeaderItem };
};

@Component({
    selector: 'app-host-event-analytics-graphs',
    templateUrl: './host-event-analytics-graphs.component.html',
    styleUrls: ['./host-event-analytics-graphs.component.scss']
})
export class HostEventAnalyticsGraphsComponent extends HostAnalyticsGraphsComponent {
    @ViewChildren(HostAnalyticsHeaderItemComponent) headers: QueryList<HostAnalyticsHeaderItemComponent>;
    @Input() eventId: string;
    // Host data response - single entity
    hostAnalytics = new Cacheable<DtoHostAnalytics>();
    performanceAnalytics = new Cacheable<DtoPerformanceAnalytics[]>();

    constructor(@Inject(LOCALE_ID) public locale: string, public hostService: HostService) {
        super(locale, hostService)
    }

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
                    this.readSinglePerformanceAnalytics();
                }
            },
            resolvers: {
                output: async v => v.period
            }
        });

        // Get the host analytics and performance analytics on component init
        this.readHostAnalytics();
        this.readSinglePerformanceAnalytics();
    }

    // For header items, snapshot of aggregate over period
    snapshot: {
        host: AnalyticsSnapshot<IHostAnalyticsMetrics>;
        performances: AnalyticsSnapshot<IPerformanceAnalyticsMetrics>;
    } = {
            host: {
                period_aggregate: {},
                header_items: {}
            },
            performances: {
                period_aggregate: {},
                header_items: {
                    total_revenue: this.createHeaderItem($localize`Total Revenue`),
                    total_ticket_sales: this.createHeaderItem($localize`Ticket sales`),
                    trailer_views: this.createHeaderItem($localize`Trailer views`)
                }
            }
        };

    get headerItems() {
        return Object.values(this.snapshot).reduce((acc, curr) => ((acc = acc.concat(curr.header_items)), acc), []);
    }

    async readSinglePerformanceAnalytics(): Promise<void> {
        const dto = await this.performanceAnalytics.request(this.hostService.readPerformanceAnalytics(
            this.hostService.currentHostValue._id, this.eventId, this.periodForm.group.value.period))

        const performancePeriods = dto.map(dto => {
            const half = Analytics.offsets[this.periodForm.group.value.period];

            const [latest, previous] = [dto.chunks.slice(0, half), dto.chunks.slice(half, dto.chunks.length)];
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

            // Populate this properties' graph with data across all chunks from all performances
            allPerformanceChunks.forEach(chunk => {
                this.snapshot.performances.header_items[property].graph.data.datasets[0].data.push(chunk.metrics[property]);
                this.snapshot.performances.header_items[property].graph.data.labels.push(unix(chunk.period_ended_at));
            });
        });
        headers?.forEach(header => header.chart?.chartInstance.update());
    }
}

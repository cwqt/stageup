import { ChartDataset } from 'chart.js';
import { Component, Inject, LOCALE_ID, OnInit, QueryList, ViewChildren, Input} from '@angular/core';
import { unix } from '@core/helpers';
import {
    Analytics,
    AnalyticsTimePeriod,
    IAnalyticsChunk,
    IHostAnalyticsMetrics,
    IPerformanceAnalyticsMetrics
} from '@core/interfaces';
import { Cacheable } from '@frontend/app.interfaces';
import { HostService } from '@frontend/services/host.service';
import {
    HostAnalyticsHeaderItemComponent,
    IHeaderItem
} from '../host-analytics-header-item/host-analytics-header-item.component';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { chartData, chartOptions } from '../host-analytics-header-item/host-analytics.chartjs';

type AnalyticsSnapshot<Metrics extends IHostAnalyticsMetrics | IPerformanceAnalyticsMetrics> = {
    period_aggregate: { [index in keyof Metrics]?: Metrics[index] };
    header_items: { [index in keyof Metrics]?: IHeaderItem };
};

@Component({
    selector: 'app-host-event-analytics-graphs',
    templateUrl: './host-event-analytics-graphs.component.html',
    styleUrls: ['./host-event-analytics-graphs.component.scss']
})
export class HostEventAnalyticsGraphsComponent implements OnInit {
    @ViewChildren(HostAnalyticsHeaderItemComponent) headers: QueryList<HostAnalyticsHeaderItemComponent>;
    @Input() eventId: string;
 
    performanceAnalytics = new Cacheable<Array<IAnalyticsChunk<IPerformanceAnalyticsMetrics>>>();

    constructor(@Inject(LOCALE_ID) public locale: string, private hostService: HostService) { }

    // For analytics period selector
    periodForm: UiForm<AnalyticsTimePeriod>;
    periodMap: { [index in AnalyticsTimePeriod]: string } = {
        WEEKLY: $localize`Weekly`,
        MONTHLY: $localize`Monthly`,
        QUARTERLY: $localize`Quarterly`,
        YEARLY: $localize`Yearly`
    };

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
                    this.readSinglePerformanceAnalytics();
                }
            },
            resolvers: {
                output: async v => v.period
            }
        });

        // Get the host analytics and performance analytics on component init
        this.readSinglePerformanceAnalytics();
    }

    // For header items, snapshot of aggregate over period
    snapshot: {
        performances: AnalyticsSnapshot<IPerformanceAnalyticsMetrics>;
    } = {
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

    async readSinglePerformanceAnalytics(): Promise<void> {
        const dto = await this.performanceAnalytics.request(this.hostService.readPerformanceAnalytics(
            this.hostService.currentHostValue._id, this.eventId, this.periodForm.group.value.period))
        const half = Analytics.offsets[this.periodForm.group.value.period];
        const [latest, previous] = [
            Analytics.entities.performance.aggregators.metrics(dto.slice(0, half).map(dto => dto.metrics)),
            Analytics.entities.performance.aggregators.metrics(
                dto.slice(half, dto.length).map(dto => dto.metrics)
            )
        ];

        // Sort in chronological order to display in the graph
        dto.sort((a, b) => a.period_ended_at - b.period_ended_at);


        const properties = Object.keys(this.snapshot.performances.header_items) as (keyof IPerformanceAnalyticsMetrics)[];
        // Clear graphs of old data
        const headers = this.headers.filter(header => header.ref == 'performances'); // only perf related charts
        headers?.forEach(headers => headers.clearGraph());

        properties.forEach(property => {

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
            dto.forEach(chunk => {
                this.snapshot.performances.header_items[property].graph.data.datasets[0].data.push(chunk.metrics[property]);
                this.snapshot.performances.header_items[property].graph.data.labels.push(unix(chunk.period_ended_at));
            });
        });
        headers?.forEach(header => header.chart?.chartInstance.update());
    }
    
    setChartColor(difference: number, graph: ChartDataset): void {
        const graphColor = difference < 0 ? '#E97B86' : difference > 0 ? '#96d0a3' : '#30a2b8';
        graph.borderColor = graphColor;
        graph.backgroundColor = graphColor;
    }
}

import { Component, OnInit } from '@angular/core';
import { i18n } from '@core/helpers';
import { CurrencyCode } from '@core/interfaces';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { ChartArea, ChartData, ChartDataset, ChartOptions, Color, ScriptableContext } from 'chart.js';
import { Except } from 'type-fest';

interface IHeaderItem {
  title: string;
  graph: {
    data: ChartData;
    options: ChartOptions;
  };
  aggreation?: string;
  aggregator: (aggregator: number) => string;
}

export type AnalyticsTimePeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

@Component({
  selector: 'frontend-host-analytics',
  templateUrl: './host-analytics.component.html',
  styleUrls: ['./host-analytics.component.scss']
})
export class HostAnalyticsComponent implements OnInit {
  constructor() {}

  periodForm: UiForm<AnalyticsTimePeriod>;
  periodMap: { [index in AnalyticsTimePeriod]: string } = {
    WEEKLY: $localize`Weekly`,
    MONTHLY: $localize`Monthly`,
    QUARTERLY: $localize`Quarterly`,
    YEARLY: $localize`Yearly`
  };
  get selectedPeriod(): string {
    return this.periodMap[this.periodForm?.group.value.period] || '';
  }

  // placeholders
  labels = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  data = [...this.labels];

  coreOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        time: { unit: 'day' },
        display: false
      },
      y: {
        display: false
      }
    }
  };

  coreData: Except<ChartDataset<'line'>, 'data'> = {
    backgroundColor: this.bgColorGradientFn,
    fill: true,
    tension: 0.3,
    pointRadius: 0,
    pointHitRadius: 0,
    borderJoinStyle: 'round',
    borderColor: '#57C84D',
    borderWidth: 1
  };

  headerItems: IHeaderItem[] = [
    {
      title: 'Performances',
      graph: {
        data: { labels: this.labels, datasets: [{ data: this.data.map(() => Math.random() * 100), ...this.coreData }] },
        options: { ...this.coreOptions }
      },
      aggregator: v => v.toLocaleString()
    },
    {
      title: 'Ticket sales',
      graph: {
        data: { labels: this.labels, datasets: [{ data: this.data.map(() => Math.random() * 100), ...this.coreData }] },
        options: { ...this.coreOptions }
      },
      aggregator: v => v.toLocaleString()
    },
    {
      title: 'Revenue',
      graph: {
        data: {
          labels: this.labels,
          datasets: [{ data: this.data.map(() => Math.random() * 25000000), ...this.coreData }]
        },
        options: { ...this.coreOptions }
      },
      aggregator: v => i18n.money(v, CurrencyCode.GBP)
    },
    {
      title: 'Trailer views',
      graph: {
        data: { labels: this.labels, datasets: [{ data: this.data.map(() => Math.random() * 100), ...this.coreData }] },
        options: { ...this.coreOptions }
      },
      aggregator: v => v.toLocaleString()
    }
  ];

  bgColorGradientFn(context: ScriptableContext<'line'>): Color {
    const chart = context.chart;
    const { ctx, chartArea: area } = chart;

    // This case happens on initial chart load
    if (!area) return null;

    // Create the gradient because this is either the first render
    // or the size of the chart has changed
    const width = area.right - area.left;
    const height = area.bottom - area.top;
    const gradient = ctx.createLinearGradient(width / 2, 0, width / 2, height);
    gradient.addColorStop(0, '#57C84D');
    gradient.addColorStop(1, '#C5E8B7');

    return gradient;
  }

  analyticsTable: UiTable;

  ngOnInit(): void {
    this.headerItems.forEach(
      item =>
        (item.aggreation = item.aggregator(
          item.graph.data.datasets[0].data.reduce<number>((acc, curr) => ((acc += curr as number), acc), 0)
        ))
    );

    this.periodForm = new UiForm({
      fields: {
        period: UiField.Select({
          initial: 'MONTHLY',
          values: new Map(Object.entries(this.periodMap).map(([key, value]) => [key, { label: value }]))
        })
      },
      resolvers: {
        output: async v => {
          return v.period;
        }
      }
    });

    this.analyticsTable = new UiTable({
      actions: [],
      resolver: async () => ({ data: [] }),
      pagination: {},
      columns: [
        // all placeholder
        {
          label: $localize`Performance`,
          accessor: v => v.performance.name
        },
        {
          label: $localize`Premiere Date`,
          accessor: v => v.performance.name
        },
        {
          label: $localize`Expiry Date`,
          accessor: v => v.performance.name
        },
        {
          label: $localize`Tickets sold`,
          accessor: v => v.performance.name
        },
        {
          label: $localize`Revenue`,
          accessor: v => v.performance.name
        },
        {
          label: $localize`Average Watch %`,
          accessor: v => v.performance.name
        },
        {
          label: $localize`Trailer Views`,
          accessor: v => v.performance.name
        }
      ]
    });
  }
}

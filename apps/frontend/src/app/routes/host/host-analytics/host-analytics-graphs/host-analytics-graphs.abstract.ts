import { ChartDataset } from 'chart.js';
import { IHeaderItem } from '../host-analytics-header-item/host-analytics-header-item.component';
import { chartData, chartOptions } from '../host-analytics-header-item/host-analytics.chartjs';

export abstract class AbstractHostAnalytics {

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

    setChartColor(difference: number, graph: ChartDataset): void {
        const graphColor = difference < 0 ? '#E97B86' : difference > 0 ? '#96d0a3' : '#30a2b8';
        graph.borderColor = graphColor;
        graph.backgroundColor = graphColor;
    }
}
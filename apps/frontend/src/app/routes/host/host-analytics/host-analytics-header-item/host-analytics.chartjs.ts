import { ChartDataset, ChartOptions, Color, ScriptableContext } from 'chart.js';
import { Except } from 'type-fest';

export const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      time: { unit: 'week' },
      display: false
    },
    y: {
      display: false,
      min: 0
    }
  }
};

export const chartData: Except<ChartDataset<'line'>, 'data'> = {
  fill: true,
  tension: 0.3,
  pointRadius: 0,
  pointHitRadius: 0,
  borderJoinStyle: 'round',
  borderWidth: 1
};

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
  backgroundColor: bgColorGradientFn,
  fill: true,
  tension: 0.3,
  pointRadius: 0,
  pointHitRadius: 0,
  borderJoinStyle: 'round',
  borderColor: '#57C84D',
  borderWidth: 1
};

export function bgColorGradientFn(context: ScriptableContext<'line'>): Color {
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

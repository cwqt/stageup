import { Pipe, PipeTransform } from '@angular/core';
import { PerformanceStatus } from '@core/interfaces';

@Pipe({
  name: 'performance-status'
})
export class PerformanceStatusPipe implements PipeTransform {
  transform(value: PerformanceStatus): any {
    const pretty: { [index in PerformanceStatus]: string } = {
      [PerformanceStatus.Complete]: $localize`Complete`,
      [PerformanceStatus.Cancelled]: $localize`Cancelled`,
      [PerformanceStatus.Deleted]: $localize`Deleted`,
      [PerformanceStatus.Live]: $localize`Live`,
      [PerformanceStatus.PendingSchedule]: $localize`Pending Schedule`,
      [PerformanceStatus.Scheduled]: $localize`Scheduled`
    };

    return pretty[value];
  }
}
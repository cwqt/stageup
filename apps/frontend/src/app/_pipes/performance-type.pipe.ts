import { Pipe, PipeTransform } from '@angular/core';
import { PerformanceType} from '@core/interfaces';

@Pipe({
  name: 'performanceTypePipe'
})
export class PerformanceTypePipe implements PipeTransform {
  transform(value: PerformanceType): any {
    const pretty: { [index in PerformanceType]: string } = {
      [PerformanceType.Live]: $localize`Livestream`,
      [PerformanceType.Vod]: $localize`Recorded`,
    };

    return pretty[value];
  }
}
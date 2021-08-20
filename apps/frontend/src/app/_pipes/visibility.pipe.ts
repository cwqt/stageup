import { Pipe, PipeTransform } from '@angular/core';
import { Visibility } from '@core/interfaces';

@Pipe({
  name: 'visibility'
})
export class VisibilityPipe implements PipeTransform {
  transform(value: Visibility): any {
    const pretty: { [index in Visibility]: string } = {
      [Visibility.Private]: $localize`Private`,
      [Visibility.Public]: $localize`Public`
    };

    return pretty[value];
  }
}
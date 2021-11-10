import { Pipe, PipeTransform } from '@angular/core';
import { ConsentOpt } from '@core/interfaces';

@Pipe({ name: 'optStatus' })
export class OptStatusPipe implements PipeTransform {

  transform(status: string): string {
    const pretty: { [index in ConsentOpt]: string } = {
      'hard-in': $localize`Opted In`,
      'hard-out': $localize`Opted Out`,
      'soft-in': $localize`Opted In`,
    }
    return pretty[status];
  }
}

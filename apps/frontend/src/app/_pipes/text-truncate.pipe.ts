import { Pipe, PipeTransform } from '@angular/core';
import { truncate } from '@core/helpers';

@Pipe({
  name: 'truncate'
})
export class TextTruncatePipe implements PipeTransform {
  // Set default limit to 25 if none is specified
  transform(...args: Parameters<typeof truncate>): string {
    return truncate(...args);
  }
}

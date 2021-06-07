import { Pipe, PipeTransform } from '@angular/core';
import { pipes } from '@core/helpers';
@Pipe({ name: 'refundReasonPipe' })
export class RefundReasonPipe implements PipeTransform {
  transform(value: any): string {
    return pipes.refundReason(value);
  }
}

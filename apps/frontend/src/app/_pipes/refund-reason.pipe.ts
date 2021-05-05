import { Pipe, PipeTransform } from '@angular/core';
import { RefundReason } from '@core/interfaces';

@Pipe({ name: 'refundReasonPipe' })
export class RefundReasonPipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in RefundReason]: string } = {
      [RefundReason.Covid]: 'COVID-19',
      [RefundReason.CancelledPostponed]: 'Event was cancelled/postponed',
      [RefundReason.Duplicate]: 'Duplicate ticket/purchased twice',
      [RefundReason.WrongTicket]: 'Wrong event purchased',
      [RefundReason.Dissatisfied]: 'Dissatisfied with event',
      [RefundReason.CannotAttend]: 'Unable to attend event',
      [RefundReason.Other]: 'Other, please provide details below...'
    };

    return prettyValues[value];
  }
}

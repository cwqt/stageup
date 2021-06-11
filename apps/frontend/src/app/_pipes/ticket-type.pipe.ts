import { Pipe, PipeTransform } from '@angular/core';
import { TicketType } from '@core/interfaces';

@Pipe({ name: 'ticketTypePipe' })
export class TicketTypePipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in TicketType]: string } = {
      [TicketType.Paid]: $localize`Paid`,
      [TicketType.Free]: $localize`Free`,
      [TicketType.Donation]: $localize`Donation`
    };

    return prettyValues[value] || $localize`Unknown Ticket Type`;
  }
}

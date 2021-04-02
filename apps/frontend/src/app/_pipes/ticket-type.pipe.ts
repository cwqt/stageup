import { Pipe, PipeTransform } from '@angular/core';
import { HostOnboardingStep, TicketType } from '@core/interfaces';

@Pipe({ name: 'ticketTypePipe' })
export class TicketTypePipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in TicketType]: string } = {
      [TicketType.Paid]: 'Paid',
      [TicketType.Free]: 'Free',
      [TicketType.Donation]: 'Donation',
    };

    return prettyValues[value] || 'Unknown Ticket Type';
  }
}

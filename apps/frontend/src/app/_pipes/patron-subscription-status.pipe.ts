import { Pipe, PipeTransform } from '@angular/core';
import { PatronSubscriptionStatus, PaymentStatus } from '@core/interfaces';

@Pipe({ name: 'patronSubscriptionStatusPipe' })
export class PatronSubscriptionStatusPipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in PatronSubscriptionStatus]: string } = {
      [PatronSubscriptionStatus.Active]: $localize`Active`,
      [PatronSubscriptionStatus.Cancelled]: $localize`Cancelled`
    };

    return prettyValues[value] || $localize`Unknown Status`;
  }
}

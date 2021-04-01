import { Pipe, PipeTransform } from '@angular/core';
import { HostOnboardingStep, PaymentStatus } from '@core/interfaces';

@Pipe({ name: 'paymentStatusPipe' })
export class PaymentStatusPipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in PaymentStatus]: string } = {
      [PaymentStatus.Created]: 'Created',
      [PaymentStatus.Fufilled]: 'Fufilled',
      [PaymentStatus.Paid]: 'Paid',
      [PaymentStatus.RefundDenied]: 'Refund Denied',
      [PaymentStatus.Refunded]: 'Refunded',
    };

    return prettyValues[value] || 'Unknown Payment Status';
  }
}

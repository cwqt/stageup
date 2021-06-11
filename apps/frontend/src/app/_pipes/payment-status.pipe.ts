import { Pipe, PipeTransform } from '@angular/core';
import { HostOnboardingStep, PaymentStatus } from '@core/interfaces';

@Pipe({ name: 'paymentStatusPipe' })
export class PaymentStatusPipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in PaymentStatus]: string } = {
      [PaymentStatus.Created]: $localize`Created`,
      [PaymentStatus.Fufilled]: $localize`Fufilled`,
      [PaymentStatus.Paid]: $localize`Paid`,
      [PaymentStatus.RefundDenied]: $localize`Refund Denied`,
      [PaymentStatus.Refunded]: $localize`Refunded`,
      [PaymentStatus.RefundRequested]: $localize`Refund Requested`
    };

    return prettyValues[value] || $localize`Unknown Payment Status`;
  }
}

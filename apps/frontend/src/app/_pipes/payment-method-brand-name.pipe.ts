import { Pipe, PipeTransform } from '@angular/core';
import { CardBrand } from '@core/interfaces';

@Pipe({
  name: 'paymentMethodBrandNamePipe'
})
export class PaymentMethodBrandName implements PipeTransform {
  transform(value: CardBrand): any {
    const pretty: { [index in CardBrand]: string } = {
      [CardBrand.Amex]: `American Express`,
      [CardBrand.Diners]: `Diners`,
      [CardBrand.Discover]: `Discover`,
      [CardBrand.JCB]: `JCB`,
      [CardBrand.Mastercard]: `Mastercard`,
      [CardBrand.UnionPay]: `UnionPay`,
      [CardBrand.Visa]: `Visa`,
      [CardBrand.Unknown]: `Unknown`
    };

    return pretty[value];
  }
}

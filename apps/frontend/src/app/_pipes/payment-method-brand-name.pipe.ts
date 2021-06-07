import { Pipe, PipeTransform } from '@angular/core';
import { CardBrand } from '@core/interfaces';
import { pipes } from '@core/helpers';

@Pipe({
  name: 'paymentMethodBrandNamePipe'
})
export class PaymentMethodBrandName implements PipeTransform {
  transform(value: CardBrand): any {
    return pipes.cardBrand(value);
  }
}

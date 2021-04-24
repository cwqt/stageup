import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyCode } from '@core/interfaces';
import { prettifyMoney } from '@core/helpers';

@Pipe({ name: 'currencyPipe' })
export class CurrencyCodePipe implements PipeTransform {
  transform(amount: number, currency: CurrencyCode): string {
    if (!amount) return '';
    return prettifyMoney(amount, currency);
  }
}

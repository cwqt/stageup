import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyCode } from '@core/interfaces';
import { i18n } from '@core/helpers';

@Pipe({ name: 'currencyPipe' })
export class CurrencyCodePipe implements PipeTransform {
  transform(amount: number, currency: CurrencyCode): string {
    if (!amount) return '';
    return i18n.money(amount, currency);
  }
}

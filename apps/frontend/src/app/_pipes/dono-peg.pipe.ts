import { Pipe, PipeTransform } from '@angular/core';
import { calculateAmountFromCurrency, CurrencyCode, DonoPeg, DONO_PEG_WEIGHT_MAPPING } from '@core/interfaces';
import { i18n } from '@core/helpers';

@Pipe({ name: 'donoPegPipe' })
export class DonoPegPipe implements PipeTransform {
  transform(peg: DonoPeg, currency: CurrencyCode): string {
    return i18n.money(calculateAmountFromCurrency(currency, DONO_PEG_WEIGHT_MAPPING[peg]), currency);
  }
}

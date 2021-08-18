import { ConsentableType } from '@core/interfaces';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gdprDocumentType'
})
export class GdprDocumentTypePipe implements PipeTransform {
  transform(value: ConsentableType): string {
    const prettyValues: { [index in ConsentableType]: string } = {
      ['general_toc']: $localize`Terms & Conditions`,
      ['privacy_policy']: $localize`Privacy Policy`,
      ['cookies']: $localize`Cookies`
    };
    return prettyValues[value] || $localize`Unknown Document Type`;
  }
}

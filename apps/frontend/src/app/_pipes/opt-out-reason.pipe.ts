import { OptOutOptions } from '@core/interfaces';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'optOutReasonPipe'
})
export class OptOutReasonPipe implements PipeTransform {
  transform(value: OptOutOptions): string {
    const prettyValues: { [index in OptOutOptions]: string } = {
      [OptOutOptions.TooFrequent]: $localize`I'm getting emails too often.`,
      [OptOutOptions.TooCluttered]: $localize`Emails are too cluttered.`,
      [OptOutOptions.NotRelevant]: $localize`The content isn't relevant to me.`,
      [OptOutOptions.DidntSignUp]: $localize`I never signed up, or I didn't realize that I have signed up.`
    };
    return prettyValues[value] || $localize`Unknown Reason`;
  }
}

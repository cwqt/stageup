import { Pipe, PipeTransform } from '@angular/core';
import { DeleteHostReason } from '@core/interfaces';

@Pipe({ name: 'deleteHostReasonPipe' })
export class DeleteHostReasonPipe implements PipeTransform {
  transform(reason: DeleteHostReason): string {
    const pretty: { [index in DeleteHostReason] } = {
      [DeleteHostReason.UnpleasantExperience]: $localize`I had an unpleasant experience.`,
      [DeleteHostReason.DissatisfactoryUX]: $localize`I am dissatisfied with the user experience`,
      [DeleteHostReason.UnhappyWithComission]: $localize`I am unhappy with the commission`,
      [DeleteHostReason.SUDidNotAddressBusinessIssue]: $localize`StageUp did not solve my business problem`,
      [DeleteHostReason.DidNotWantToOfferDigitalPerfs]: $localize`I do not want to continue offering digital performances`
    };

    return pretty[reason];
  }
}

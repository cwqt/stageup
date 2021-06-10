import { Pipe, PipeTransform } from '@angular/core';
import { DeleteHostReason } from '@core/interfaces';

@Pipe({ name: 'deleteHostReasonPipe' })
export class DeleteHostReasonPipe implements PipeTransform {
  transform(reason: DeleteHostReason): string {
    const pretty: { [index in DeleteHostReason] } = {
      [DeleteHostReason.UnpleasantExperience]: 'I had an unpleasant experience.',
      [DeleteHostReason.DissatisfactoryUX]: 'I am dissatisfied with the user experience',
      [DeleteHostReason.UnhappyWithComission]: 'I am unhappy with the commission',
      [DeleteHostReason.SUDidNotAddressBusinessIssue]: 'StageUp did not solve my business problem',
      [DeleteHostReason.DidNotWantToOfferDigitalPerfs]: 'I do not want to continue offering digital performances'
    };

    return pretty[reason];
  }
}

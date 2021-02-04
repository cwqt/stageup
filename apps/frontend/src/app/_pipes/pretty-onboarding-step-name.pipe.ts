import { Pipe, PipeTransform } from '@angular/core';
import { HostOnboardingStep } from '@core/interfaces';

@Pipe({ name: 'prettyOnboardingStepNamePipe' })
export class PrettyOnboardingStepNamePipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in HostOnboardingStep]: string } = {
      [HostOnboardingStep.ProofOfBusiness]: 'Proof of Business',
      [HostOnboardingStep.OwnerDetails]: 'Owner Details',
      [HostOnboardingStep.SocialPresence]: 'Social Presence',
      [HostOnboardingStep.AddMembers]: 'Add Members',
      [HostOnboardingStep.SubscriptionConfiguration]: 'Subscription Configuration'
    };

    return prettyValues[value] || 'Unknown Step';
  }
}

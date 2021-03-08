import { Pipe, PipeTransform } from '@angular/core';
import { HostOnboardingStep } from '@core/interfaces';

@Pipe({ name: 'onboardingStepPipe' })
export class OnboardingStepPipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in HostOnboardingStep]: string } = {
      [HostOnboardingStep.ProofOfBusiness]: 'Proof of Business',
      [HostOnboardingStep.OwnerDetails]: 'Owner Details',
      [HostOnboardingStep.SocialPresence]: 'Social Presence'
    };

    return prettyValues[value] || 'Unknown Step';
  }
}

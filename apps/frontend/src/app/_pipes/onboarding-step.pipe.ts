import { Pipe, PipeTransform } from '@angular/core';
import { HostOnboardingStep } from '@core/interfaces';

@Pipe({ name: 'onboardingStepPipe' })
export class OnboardingStepPipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in HostOnboardingStep]: string } = {
      [HostOnboardingStep.ProofOfBusiness]: $localize`Proof of Business`,
      [HostOnboardingStep.OwnerDetails]: $localize`Owner Details`,
      [HostOnboardingStep.SocialPresence]: $localize`Social Presence`
    };

    return prettyValues[value] || 'Unknown Step';
  }
}

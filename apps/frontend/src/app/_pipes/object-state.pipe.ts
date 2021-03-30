import { Pipe, PipeTransform } from '@angular/core';
import { HostOnboardingState } from '@core/interfaces';

@Pipe({ name: 'onboardingStatePipe' })
export class OnboardingStatePipe implements PipeTransform {
  transform(value: any): string {
    switch (value) {
      case HostOnboardingState.AwaitingChanges:
        return 'Awaiting Changes';
      case HostOnboardingState.PendingVerification:
        return 'Pending Verification';
      case HostOnboardingState.HasIssues:
        return 'Has Issues';
      case HostOnboardingState.Verified:
        return 'Verified';
      case HostOnboardingState.Enacted:
        return 'Enacted';
      case HostOnboardingState.Modified:
        return 'Modified';
      default:
        return 'Unknown State';
    }
  }
}

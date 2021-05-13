import { Pipe, PipeTransform } from '@angular/core';
import { HostOnboardingState } from '@core/interfaces';

@Pipe({ name: 'onboardingStatePipe' })
export class OnboardingStatePipe implements PipeTransform {
  transform(value: any): string {
    switch (value) {
      case HostOnboardingState.AwaitingChanges:
        return $localize`:@@host_onboarding_state_awaiting_changes:Awaiting Changes`;
      case HostOnboardingState.PendingVerification:
        return $localize`:@@host_onboarding_state_pending_verification:Pending Verification`;
      case HostOnboardingState.HasIssues:
        return $localize`:@@host_onboarding_state_has_issues:Has Issues`;
      case HostOnboardingState.Verified:
        return $localize`:@@host_onboarding_state_verified:Verified`;
      case HostOnboardingState.Enacted:
        return $localize`:@@host_onboarding_state:Enacted`;
      case HostOnboardingState.Modified:
        return $localize`:@@host_onboarding_state_modified:Modified`;
      default:
        return $localize`Unknown State`;
    }
  }
}

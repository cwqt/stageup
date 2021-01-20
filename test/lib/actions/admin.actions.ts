import {
  IEnvelopedData,
  IHostOnboarding,
  HostOnboardingStep,
  IOnboardingStepReviewSubmission,
} from '@eventi/interfaces';
import { IOnboardingStepReview } from '@eventi/interfaces';
import Axios from 'axios';
import { environment } from '../environment';

export default {
  // router.get  <IE<IHOnboarding[], void>>(`/admin/onboarding`, Admin.readOnboardingProcesses());
  readOnboardingProcesses: async (page: number = 1): Promise<IEnvelopedData<IHostOnboarding[], void>> => {
    const res = await Axios.get<IEnvelopedData<IHostOnboarding[], void>>(
      `${environment.baseUrl}/admin/onboarding?page=${page}`,
      environment.getOptions()
    );
    return res.data;
  },

  // router.post  <void> (`/admin/onboarding/:oid/:step/review`, Admin.reviewStep());
  reviewStep: async <T>(
    onboarding: IHostOnboarding,
    step: HostOnboardingStep,
    review: IOnboardingStepReviewSubmission<T>
  ): Promise<void> => {
    const res = await Axios.post(
      `${environment.baseUrl}/admin/onboarding/${onboarding._id}/${step}/review`,
      review,
      environment.getOptions()
    );

    return res.data;
  },

  // router.post <void> ("/admin/onboarding/:oid/enact", Admin.enactOnboardingProcess());
  enactOnboardingProcess: async (onboarding: IHostOnboarding): Promise<void> => {
    const res = await Axios.post(
      `${environment.baseUrl}/admin/onboarding/${onboarding._id}/enact`,
      null,
      environment.getOptions()
    );
    return res.data;
  },
};

import {
  IEnvelopedData,
  IHostOnboarding,
  IOnboardingReview
} from '@eventi/interfaces';
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

  // router.post <void> (`/admin/onboarding/:oid/review`, Admin.reviewOnboardingProcess());
  reviewOnboardingProcess: async <T>(onboarding: IHostOnboarding, reviews: IOnboardingReview['steps']): Promise<void> => {
    const res = await Axios.post(
      `${environment.baseUrl}/admin/onboarding/${onboarding._id}/review`,
      reviews,
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
  }
};

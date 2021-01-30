import { IEnvelopedData, IHostOnboarding, IOnboardingReview } from '@eventi/interfaces';
import { api } from '../environment';
import { environment } from '../environment';

export default {
  // router.get  <IE<IHOnboarding[], void>>(`/admin/onboarding`, Admin.readOnboardingProcesses());
  readOnboardingProcesses: async (page: number = 1): Promise<IEnvelopedData<IHostOnboarding[], void>> => {
    const res = await api.get<IEnvelopedData<IHostOnboarding[], void>>(
      `/admin/onboarding?page=${page}`,
      environment.getOptions()
    );
    return res.data;
  },

  // router.post <void> (`/admin/onboarding/:oid/review`, Admin.reviewOnboardingProcess());
  reviewOnboardingProcess: async <T>(
    onboarding: IHostOnboarding,
    review: IOnboardingReview['steps']
  ): Promise<void> => {
    const res = await api.post(`/admin/onboarding/${onboarding._id}/review`, review, environment.getOptions());
    return res.data;
  },

  // router.post <void> ("/admin/onboarding/:oid/enact", Admin.enactOnboardingProcess());
  enactOnboardingProcess: async (onboarding: IHostOnboarding): Promise<void> => {
    const res = await api.post(`/admin/onboarding/${onboarding._id}/enact`, null, environment.getOptions());
    return res.data;
  }
};

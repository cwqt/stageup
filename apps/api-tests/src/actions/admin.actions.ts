import { IEnvelopedData, IHostOnboarding, IOnboardingReview } from '@core/interfaces';
import { api } from '../environment';
import { environment } from '../environment';

export default {
  // router.get  <IE<IHOnboarding[], void>>(`/admin/onboardings`, Admin.readOnboardingProcesses());
  readOnboardingProcesses: async (page: number = 1): Promise<IEnvelopedData<IHostOnboarding[], void>> => {
    const res = await api.get<IEnvelopedData<IHostOnboarding[], void>>(
      `/admin/onboardings?page=${page}`,
      environment.getOptions()
    );
    return res.data;
  },

  // router.post <void> (`/admin/onboardings/:oid/review`, Admin.reviewOnboardingProcess());
  reviewOnboardingProcess: async <T>(
    onboarding: IHostOnboarding,
    review: IOnboardingReview['steps']
  ): Promise<void> => {
    const res = await api.post(`/admin/onboardings/${onboarding._id}/review`, review, environment.getOptions());
    return res.data;
  },

  // router.post <void> ("/admin/onboardings/:oid/enact", Admin.enactOnboardingProcess());
  enactOnboardingProcess: async (onboarding: IHostOnboarding): Promise<void> => {
    const res = await api.post(`/admin/onboardings/${onboarding._id}/enact`, null, environment.getOptions());
    return res.data;
  }
};

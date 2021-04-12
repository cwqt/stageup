import { IEnvelopedData, IHostOnboarding, IHostStub, IOnboardingReview } from '@core/interfaces';
import { api } from '../environment';
import { environment } from '../environment';

export default {
  // router.get  <IE<IHOnboarding[], void>>(`/admin/onboardings`, Admin.readOnboardingProcesses());
  readOnboardingProcesses: async (page: number = 0): Promise<IEnvelopedData<IHostOnboarding[], void>> => {
    const res = await api.get<IEnvelopedData<IHostOnboarding[], void>>(
      `/admin/onboardings?page=${page}`,
      environment.getOptions()
    );
    return res.data;
  },

  // router.post <void> (`/admin/onboardings/:hid/review`, Admin.reviewOnboardingProcess());
  reviewOnboardingProcess: async <T>(
    host: IHostStub,
    review: IOnboardingReview['steps']
  ): Promise<void> => {
    const res = await api.post(`/admin/onboardings/${host._id}/review`, review, environment.getOptions());
    return res.data;
  },

  // router.post <void> ("/admin/onboardings/:hid/enact", Admin.enactOnboardingProcess());
  enactOnboardingProcess: async (host: IHostStub): Promise<void> => {
    const res = await api.post(`/admin/onboardings/${host._id}/enact`, null, environment.getOptions());
    return res.data;
  }
};

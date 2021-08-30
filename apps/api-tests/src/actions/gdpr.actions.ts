import { environment as env, UserType } from '../environment';
import {
  HostOnboardingStep,
  IHost,
  IHostOnboarding,
  IHostStub,
  IOnboardingStep,
  IUser,
  IUserStub,
  IHostMemberChangeRequest,
  IOnboardingStepMap,
  IEnvelopedData,
  IPerformance,
  IUserHostInfo,
  IMyself,
  IPerformanceUserInfo,
  IHostInvoice,
  IInvoice,
  IUserHostMarketingConsent
} from '@core/interfaces';
import { api } from '../environment';
import fd from 'form-data';

export default {
  // GDPR CRUD --------------------------------------------------------------------------------------------------------------

  // router.get<IEnvelopedData<IUserHostMarketingConsent[]>>("/hosts/:hid",Hosts.readHost())
  readUserHostConsents: async (): Promise<IEnvelopedData<IUserHostMarketingConsent[]>> => {
    const res = await api.get<IEnvelopedData<IUserHostMarketingConsent[]>>(
      `/myself/opt-ins/host-marketing`,
      env.getOptions()
    );
    return res.data;
  }
};

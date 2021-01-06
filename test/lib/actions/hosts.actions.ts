import Axios from 'axios';
import { environment as env } from '../environment';
import { HostOnboardingStep, IHost, IHostOnboarding, IHostOnboardingProcess, IHostStub, IMyself, IOnboardingStep, IUser, IUserStub } from '@eventi/interfaces';

export default {
  createHost: async (data:{username:string, name:string, email_address:string}):Promise<IHost> => {
    const res = await Axios.post<IHost>(`${env.baseUrl}/hosts`, data, env.getOptions());
    return res.data;
  },

  // router.get <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.readOnboardingProcessStep());
  readOnboardingProcessStep: async <T>(host:IHostStub, step:HostOnboardingStep) => {
    const res = await Axios.get<IOnboardingStep<T>>(`${env.baseUrl}/hosts/${host._id}/onboarding/${step}`, env.getOptions());
    return res.data;
  },

  // router.put <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.updateOnboardingProcessStep());
  updateOnboardingProcessStep: async <T>(host:IHostStub, step:HostOnboardingStep, data:T) => {
    const res = await Axios.put(`${env.baseUrl}/hosts/${host._id}/onboarding/${step}`, data, env.getOptions());
    return res.data;
  },

  // router.get<IHostOnboarding> ("/hosts/:hid/onboarding/status", Hosts.readOnboardingProcessStatus());
  readOnboardingProcessStatus: async (host:IHostStub | IHost) => {
    const res = await Axios.get<IHostOnboarding>(`${env.baseUrl}/hosts/${host._id}/onboarding/status`, env.getOptions());
    return res.data;
  },

  // router.post<void> ("/hosts/:hid/onboarding/submit", Hosts.submitOnboardingProcess());
  submitOnboardingProcess: async (host:IHost | IHost) => {
    let res = await Axios.post<void>(`${env.baseUrl}/hosts/${host._id}/onboarding/submit`, null, env.getOptions());      
    return res.data;
  }
};

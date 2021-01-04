import Axios from 'axios';
import { environment as env } from '../environment';
import { HostOnboardingStep, IHost, IHostOnboardingProcess, IHostStub, IMyself, IUser, IUserStub } from '@eventi/interfaces';

export default {
  createHost: async (data:{username:string, name:string, email_address:string}):Promise<IHost> => {
    const res = await Axios.post<IHost>(`${env.baseUrl}/hosts`, data, env.getOptions());
    return res.data;
  },

  // router.get <IOnboardingStep<any>>   ("/hosts/:hid/onboarding/:step",          Hosts.readOnboardingProcessStep());
  readOnboardingProcessStep: async (host:IHostStub, step:HostOnboardingStep) => {
    const res = await Axios.get(`${env.baseUrl}/hosts/${host._id}/onboarding/${step}`, env.getOptions());
    return res;
  },

  // router.put <IOnboardingStep<any>>   ("/hosts/:hid/onboarding/:step",          Hosts.updateOnboardingProcessStep());
  updateOnboardingProcessStep: async <T>(host:IHostStub, step:HostOnboardingStep, data:T) => {
    const res = await Axios.put(`${env.baseUrl}/hosts/${host._id}/onboarding/${step}`, data, env.getOptions());
    return res.data;
  },

  // router.get<IHostOnboardingProcess>  ("/hosts/:hid/onboarding/status",         Hosts.readOnboardingProcessStatus());
  readOnboardingProcessStatus: async (host:IHostStub | IHost) => {
    const res = await Axios.get<IHostOnboardingProcess>(`${env.baseUrl}/hosts/${host._id}/onboarding/status`);
    return res.data;
  }
};

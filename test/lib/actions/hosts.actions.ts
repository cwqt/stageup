import Axios from 'axios';
import { environment as env } from '../environment';
import { IHost, IHostOnboardingProcess, IHostStub, IMyself, IUser, IUserStub } from '@eventi/interfaces';

export default {
  createHost: async (data:{username:string, name:string, email_address:string}):Promise<IHost> => {
    const res = await Axios.post<IHost>(`${env.baseUrl}`, data, env.getOptions());
    return res.data;
  },

  updateOnboardingProcess: async (data:any) => {},

  // router.get<IHostOnboardingProcess>  ("/hosts/:hid/onboarding/status",         Hosts.readOnboardingProcessStatus());
  readOnboardingProcessStatus: async (host:IHostStub | IHost) => {
    const res = await Axios.get<IHostOnboardingProcess>(`${env.baseUrl}/hosts/${host._id}/onboarding/status`);
    return res.data;
  }
};

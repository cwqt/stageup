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
} from '@eventi/interfaces';
import { api } from '../environment';

export default {
  // Host CRUD --------------------------------------------------------------------------------------------------------------
  // router.post<IHost>("/hosts", Hosts.createHost());
  createHost: async (data: { username: string; name: string; email_address: string }): Promise<IHost> => {
    const res = await api.post<IHost>(`/hosts`, data, env.getOptions());
    return res.data;
  },

  // router.get<IHost>("/hosts/:hid",Hosts.readHost())
  readHost: async (host: IHostStub): Promise<IHostStub> => {
    const res = await api.get<IHost>(`/hosts/${host._id}`, env.getOptions());
    return res.data;
  },

  // router.put<IHost> ("/hosts/:hid",Hosts.updateHost());
  updateHost: async (host: IHost) => {
    const res = await api.post<IHost>(`/hosts/${host._id}`, env.getOptions());
    return res.data;
  },
  
  // router.delete <void>("/hosts/:hid",Hosts.deleteHost());
  deleteHost: async (host: IHost) => {
    const res = await api.post<void>(`/hosts/${host._id}`, env.getOptions());
    return res.data;
  },

  // Host Onboarding --------------------------------------------------------------------------------------------------------------
  // router.get <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.readOnboardingProcessStep());
  readOnboardingProcessStep: async <T>(host: IHostStub, step: HostOnboardingStep) => {
    const res = await api.get<IOnboardingStep<T>>(
      `/hosts/${host._id}/onboarding/${step}`,
      env.getOptions()
    );
    return res.data;
  },

  // router.put <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.updateOnboardingProcessStep());
  updateOnboardingProcessStep: async <T>(host: IHostStub, step: HostOnboardingStep, data: T) => {
    const res = await api.put(`/hosts/${host._id}/onboarding/${step}`, data, env.getOptions());
    return res.data;
  },

  // router.get<IHostOnboarding> ("/hosts/:hid/onboarding/status", Hosts.readOnboardingProcessStatus());
  readOnboardingProcessStatus: async (host: IHostStub | IHost) => {
    const res = await api.get<IHostOnboarding>(
      `/hosts/${host._id}/onboarding/status`,
      env.getOptions()
    );
    return res.data;
  },

  // router.get <IOnboardingStepMap> ("/hosts/:hid/onboarding/steps", Hosts.readOnboardingSteps());
  readOnboardingSteps: async (host:IHost | IHostStub):Promise<IOnboardingStepMap> => {
    const res = await api.get(`/hosts/${host._id}/onboarding/steps`, env.getOptions());
    return res.data;
  },

  // router.post<void> ("/hosts/:hid/onboarding/submit", Hosts.submitOnboardingProcess());
  submitOnboardingProcess: async (host: IHost | IHost) => {
    const res = await api.post<void>(`/hosts/${host._id}/onboarding/submit`, null, env.getOptions());
    return res.data;
  },

  // Host member CRUD --------------------------------------------------------------------------------------------------------------
  // router.get <IUserStub[]>("/hosts/:hid/members", Hosts.readMembers());
  readMembers: async (host: IHost) => {
    const res = await api.get<IUserStub[]>(`/hosts/${host._id}/members`, env.getOptions());
    return res.data;
  },

  // router.post<IHost>("/hosts/:hid/members",Hosts.addMember());
  addMember: async (host: IHost, user:IUser) => {
    const res = await api.post<IHost>(`/hosts/${host._id}/members`, { value: user._id}, env.getOptions());
    return res.data;
  },

  // router.delete <void> ("/hosts/:hid/members/:mid",Hosts.removeMember());
  removeMember: async (host: IHost, user: IUser) => {
    const res = await api.delete<void>(`/hosts/${host._id}/members/${user._id}`, env.getOptions());
    return res.data;
  },

  // router.put<void>("/hosts/:hid/members/:mid",Hosts.updateMember());
  updateMember: async (host: IHost, user: IUser, update:IHostMemberChangeRequest) => {
    const res = await api.put<void>(`/hosts/${host._id}/members/${user._id}`, update, env.getOptions());
    return res.data;
  },
};

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
  IHostBusinessDetails,
  CountryCode,
  BusinessType,
  HostOnboardingState,
  PersonTitle
} from '@core/interfaces';
import { api } from '../environment';
import fd from 'form-data';
import { hostname } from 'os';
import { Stories } from '../stories';

export default {
  // Host CRUD --------------------------------------------------------------------------------------------------------------
  // router.post<IHost>("/hosts", Hosts.createHost());
  createHost: async (data: { username: string; name: string; email_address: string }): Promise<IHost> => {
    const res = await api.post<IHost>(`/hosts`, data, env.getOptions());
    return res.data;
  },

  createOnBoardedHost: async (data: { username: string; name: string; email_address: string }): Promise<IHost> => {
    const host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si'
    });

    await Stories.actions.hosts.readOnboardingProcessStatus(host);

    await Stories.actions.hosts.updateOnboardingProcessStep<IHostBusinessDetails>(
      host,
      HostOnboardingStep.ProofOfBusiness,
      {
        business_address: {
          city: 'Cardiff',
          country: CountryCode.GB,
          postal_code: 'NE62 5DE',
          line1: '32 Marquee Court'
        },
        hmrc_company_number: 11940210,
        business_contact_number: '+44 323 223 4234',
        business_type: BusinessType.Company
      }
    );

    await Stories.actions.hosts.updateOnboardingProcessStep(
      host,
      HostOnboardingStep.OwnerDetails,
      {
        title: PersonTitle.Dr,
        first_name: 'Drake',
        last_name: 'Drakeford'
      }
    );

    await Stories.actions.hosts.updateOnboardingProcessStep(
      host,
      HostOnboardingStep.SocialPresence,
      {
        site_url: 'https://linkedin.com/stageupuk',
        linkedin_url: 'https://linkedin.com/eventi',
        facebook_url: 'https://facebook.com/eventi',
        instagram_url: 'https://instagram.com/eventi'
      }
    );

    await Stories.actions.hosts.submitOnboardingProcess(host);

    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    await Stories.actions.admin.reviewOnboardingProcess(host, {
      [HostOnboardingStep.OwnerDetails]: {
        state: HostOnboardingState.Verified,
        issues: {}
      },
      [HostOnboardingStep.SocialPresence]: {
        state: HostOnboardingState.Verified,
        issues: {}
      },
      [HostOnboardingStep.ProofOfBusiness]: {
        state: HostOnboardingState.Verified,
        issues: {}
      }
    });

    return host;
  },

  // router.get<IHost>("/hosts/:hid",Hosts.readHost())
  readHost: async (host: IHostStub, hostId?: string): Promise<IHost> => {
    const res = await api.get<IHost>(`/hosts/${hostId || host._id}`, env.getOptions());
    return res.data;
  },

  // router.get <IHost> ("/hosts/@:username", Hosts.readHostByUsername());
  readHostByUsername: async (host: IHostStub, hostUsername?: string): Promise<IHost> => {
    const res = await api.get<IHost>(`/hosts/@${hostUsername || host.username}`, env.getOptions());
    return res.data;
  },

  // router.put<IHost> ("/hosts/:hid",Hosts.updateHost());
  updateHost: async (host: IHost) => {
    const res = await api.post<IHost>(`/hosts/${host._id}`, null, env.getOptions());
    return res.data;
  },

  // router.delete <void>("/hosts/:hid",Hosts.deleteHost());
  deleteHost: async (host: IHost) => {
    const res = await api.post<void>(`/hosts/${host._id}`, null, env.getOptions());
    return res.data;
  },

  //router.put<IHostS>("/hosts/:hid/avatar", Hosts.changeAvatar());
  changeAvatar: async (host: IHost, data: fd): Promise<IHostStub> => {
    const options = env.getOptions();
    options.headers['Content-Type'] = data.getHeaders()['content-type'];

    const res = await api.put<IHostStub>(`/hosts/${host._id}/avatar`, data, options);
    return res.data;
  },

  //router.put<IHostS>("/hosts/:hid/banner", Hosts.changeBanner());
  changeBanner: async (host: IHost, data: fd): Promise<IHostStub> => {
    const options = env.getOptions();
    options.headers['Content-Type'] = data.getHeaders()['content-type'];

    const res = await api.put<IHostStub>(`/hosts/${host._id}/banner`, data, options);
    return res.data;
  },

  // Host Onboarding --------------------------------------------------------------------------------------------------------------
  // router.get <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.readOnboardingProcessStep());
  readOnboardingProcessStep: async <T>(host: IHostStub, step: HostOnboardingStep) => {
    const res = await api.get<IOnboardingStep<T>>(`/hosts/${host._id}/onboarding/${step}`, env.getOptions());
    return res.data;
  },

  // router.put <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.updateOnboardingProcessStep());
  updateOnboardingProcessStep: async <T>(host: IHostStub, step: HostOnboardingStep, data: T) => {
    const res = await api.put(`/hosts/${host._id}/onboarding/${step}`, data, env.getOptions());
    return res.data;
  },

  // router.get<IHostOnboarding> ("/hosts/:hid/onboarding/status", Hosts.readOnboardingProcessStatus());
  readOnboardingProcessStatus: async (host: IHostStub | IHost) => {
    const res = await api.get<IHostOnboarding>(`/hosts/${host._id}/onboarding/status`, env.getOptions());
    return res.data;
  },

  // router.get <IOnboardingStepMap> ("/hosts/:hid/onboarding/steps", Hosts.readOnboardingSteps());
  readOnboardingSteps: async (host: IHost | IHostStub): Promise<IOnboardingStepMap> => {
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
    const res = await api.get<IEnvelopedData<IUserHostInfo[]>>(`/hosts/${host._id}/members`, env.getOptions());
    return res.data;
  },

  // router.post<IHost>("/hosts/:hid/members",Hosts.addMember());
  addMember: async (host: IHost, user: IMyself['user']) => {
    const res = await api.post<IUserHostInfo>(
      `/hosts/${host._id}/members`,
      { value: user.email_address },
      env.getOptions()
    );
    return res.data;
  },

  // router.delete <void> ("/hosts/:hid/members/:mid",Hosts.removeMember());
  removeMember: async (host: IHost, user: IUser) => {
    const res = await api.delete<void>(`/hosts/${host._id}/members/${user._id}`, env.getOptions());
    return res.data;
  },

  // router.put<void>("/hosts/:hid/members/:mid",Hosts.updateMember());
  updateMember: async (host: IHost, user: IUser, update: IHostMemberChangeRequest) => {
    const res = await api.put<void>(`/hosts/${host._id}/members/${user._id}`, update, env.getOptions());
    return res.data;
  },

  // router.get <IE<IPerf[], null>> ("/hosts/:hid/performances", Hosts.readHostPerformances());
  readHostPerformances: async (
    host: IHost,
    page: number = 0,
    perPage: number = 10
  ): Promise<IEnvelopedData<IPerformance[], null>> => {
    const res = await api.get<IEnvelopedData<IPerformance[], null>>(
      `/hosts/${host._id}/performances?page=${page}&per_page=${perPage}`,
      env.getOptions()
    );
    return res.data;
  },

  // router.post <void> ("/hosts/:hid/performances/:pid/provision", Hosts.provisionPerformanceAccessTokens());
  provisionPerformanceAccessTokens: async (
    host: IHost,
    performance: IPerformance,
    data: { email_addresses: string[] }
  ): Promise<void> => {
    const res = await api.post<void>(
      `/hosts/${host._id}/performances/${performance._id}/provision`,
      data,
      env.getOptions()
    );
    return res.data;
  },

  //router.get<IHostInvoice>("/hosts/:hid/invoices/:iid",Hosts.readInvoice());
  readInvoice: async (host: IHost, invoice: IInvoice): Promise<IHostInvoice> => {
    const res = await api.get<IHostInvoice>(`/hosts/${host._id}/invoices/${invoice._id}`, env.getOptions());
    return null;
  },

  //router.post<string>("/hosts/:hid/stripe/connect", Hosts.connectStripe)
  connectStripe: async (host: IHost) => {
    const res = await api.post<string>(`/hosts/${host._id}/stripe/connect`, null, env.getOptions());
    // return this.http.post<string>(`/api/hosts/${hostId}/stripe/connect`, null).toPromise();
    return null;
  },
};

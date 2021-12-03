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
  PersonTitle,
  DtoReadHost,
  IHostPrivate,
  DtoUpdateHost,
  IHostFeed,
  IHostStripeInfo,
  IFollower,
  DtoUserMarketingInfo,
  DtoHostAnalytics,
  AnalyticsTimePeriod,
  DeleteHostReason,
  DtoPerformanceIDAnalytics
} from '@core/interfaces';
import { api } from '../environment';
import fd from 'form-data';
import { hostname } from 'os';
import { Stories } from '../stories';
import { enumToValues, querize } from '@core/helpers';
import { array } from 'superstruct';

export default {
  // Host CRUD --------------------------------------------------------------------------------------------------------------
  // router.post<IHost>("/hosts", Hosts.createHost());
  createHost: async (data: { username: string; name: string; email_address: string }): Promise<IHost> => {
    const res = await api.post<IHost>(`/hosts`, data, env.getOptions());
    return res.data;
  },

  createOnboardedHost: async (data: { username: string; name: string; email_address: string }): Promise<IHost> => {
    const host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host+test@stageup.uk'
    });

    return await Stories.actions.hosts.onboardHost(host);
  },

  onboardHost: async (host: IHost): Promise<IHost> => {
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

    await Stories.actions.hosts.updateOnboardingProcessStep(host, HostOnboardingStep.OwnerDetails, {
      title: PersonTitle.Dr,
      first_name: 'Drake',
      last_name: 'Drakeford'
    });

    await Stories.actions.hosts.updateOnboardingProcessStep(host, HostOnboardingStep.SocialPresence, {
      site_url: 'https://linkedin.com/stageupuk',
      linkedin_url: 'https://linkedin.com/eventi',
      facebook_url: 'https://facebook.com/eventi',
      instagram_url: 'https://instagram.com/eventi'
    });

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

  // router.get<DtoReadHost>("/hosts/:hid",Hosts.readHost())
  readHost: async (host: IHostStub, hostId?: string): Promise<DtoReadHost> => {
    const res = await api.get<DtoReadHost>(`/hosts/${hostId || host._id}`, env.getOptions());
    return res.data;
  },

  // router.get <DtoReadHost> ("/hosts/@:username", Hosts.readHostByUsername());
  readHostByUsername: async (host: IHostStub, hostUsername?: string): Promise<DtoReadHost> => {
    const res = await api.get<DtoReadHost>(`/hosts/@${hostUsername || host.username}`, env.getOptions());
    return res.data;
  },

  // router.get<IHostPrivate>("/hosts/:hid/details",Hosts.readDetails);
  readHostDetails: async (host: IHost): Promise<IHostPrivate> => {
    const res = await api.get<IHostPrivate>(`/hosts/${host._id}/details`, env.getOptions());
    return res.data;
  },

  // router.put<IHost> ("/hosts/:hid",Hosts.updateHost());
  updateHost: async (host: IHost, body: DtoUpdateHost): Promise<IHostPrivate> => {
    const res = await api.put<IHostPrivate>(`/hosts/${host._id}`, body, env.getOptions());
    return res.data;
  },

  // router.delete <void>("/hosts/:hid",Hosts.deleteHost());
  deleteHost: async (host: IHost): Promise<void> => {
    const query: {
      assert_only: boolean;
      reason: DeleteHostReason[];
      explanation: string;
    } = {
      assert_only: true,
      reason: [DeleteHostReason.DidNotWantToOfferDigitalPerfs, DeleteHostReason.DissatisfactoryUX],
      explanation: 'abc'
    };
    await api.delete<void>(`/hosts/${host._id}${querize(query)}`, env.getOptions());
  },

  //router.put<string>("/hosts/:hid/avatar", Hosts.changeAvatar());
  changeAvatar: async (host: IHost, data: fd): Promise<string> => {
    const options = env.getOptions();
    options.headers['Content-Type'] = data.getHeaders()['content-type'];

    const res = await api.put<string>(`/hosts/${host._id}/avatar`, data, options);
    return res.data;
  },

  //router.put<string>("/hosts/:hid/banner", Hosts.changeBanner());
  changeBanner: async (host: IHost, data: fd): Promise<string> => {
    const options = env.getOptions();
    options.headers['Content-Type'] = data.getHeaders()['content-type'];

    const res = await api.put<string>(`/hosts/${host._id}/banner`, data, options);
    return res.data;
  },

  // Host Onboarding --------------------------------------------------------------------------------------------------------------
  // router.get <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.readOnboardingProcessStep());
  readOnboardingProcessStep: async <T>(host: IHostStub, step: HostOnboardingStep): Promise<IOnboardingStep<T>> => {
    const res = await api.get<IOnboardingStep<T>>(`/hosts/${host._id}/onboarding/${step}`, env.getOptions());
    return res.data;
  },

  // router.put <IOnboardingStep<any>> ("/hosts/:hid/onboarding/:step", Hosts.updateOnboardingProcessStep());
  updateOnboardingProcessStep: async <T>(
    host: IHostStub,
    step: HostOnboardingStep,
    data: T
  ): Promise<IOnboardingStep<any>> => {
    const res = await api.put<IOnboardingStep<any>>(`/hosts/${host._id}/onboarding/${step}`, data, env.getOptions());
    return res.data;
  },

  // router.get<IHostOnboarding> ("/hosts/:hid/onboarding/status", Hosts.readOnboardingProcessStatus());
  readOnboardingProcessStatus: async (host: IHostStub | IHost): Promise<IHostOnboarding> => {
    const res = await api.get<IHostOnboarding>(`/hosts/${host._id}/onboarding/status`, env.getOptions());
    return res.data;
  },

  // router.get <IOnboardingStepMap> ("/hosts/:hid/onboarding/steps", Hosts.readOnboardingSteps());
  readOnboardingSteps: async (host: IHost | IHostStub): Promise<IOnboardingStepMap> => {
    const res = await api.get(`/hosts/${host._id}/onboarding/steps`, env.getOptions());
    return res.data;
  },

  // router.post<void> ("/hosts/:hid/onboarding/submit", Hosts.submitOnboardingProcess());
  submitOnboardingProcess: async (host: IHost | IHost): Promise<void> => {
    await api.post<void>(`/hosts/${host._id}/onboarding/submit`, null, env.getOptions());
  },

  // Host member CRUD --------------------------------------------------------------------------------------------------------------
  // router.get <IUserStub[]>("/hosts/:hid/members", Hosts.readMembers());
  readMembers: async (host: IHost): Promise<IEnvelopedData<IUserHostInfo[]>> => {
    const res = await api.get<IEnvelopedData<IUserHostInfo[]>>(`/hosts/${host._id}/members`, env.getOptions());
    return res.data;
  },

  // router.post<IHost>("/hosts/:hid/members",Hosts.addMember());
  addMember: async (host: IHost, user: IMyself['user']): Promise<IUserHostInfo> => {
    const res = await api.post<IUserHostInfo>(
      `/hosts/${host._id}/members`,
      { value: user.email_address },
      env.getOptions()
    );
    return res.data;
  },

  // router.delete <void> ("/hosts/:hid/members/:mid",Hosts.removeMember());
  removeMember: async (host: IHost, user: IUser): Promise<void> => {
    await api.delete<void>(`/hosts/${host._id}/members/${user._id}`, env.getOptions());
  },

  // router.put<void>("/hosts/:hid/members/:mid",Hosts.updateMember());
  updateMember: async (host: IHost, user: IUser, update: IHostMemberChangeRequest): Promise<void> => {
    await api.put<void>(`/hosts/${host._id}/members/${user._id}`, update, env.getOptions());
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
  connectStripe: async (host: IHost): Promise<string> => {
    const res = await api.post<string>(`/hosts/${host._id}/stripe/connect`, null, env.getOptions());
    return res.data;
  },

  // router.redirect("/hosts/:hid/invites/:iid", Hosts.handleHostInvite);
  handleHostInvite: async (host: IHost, inviteId: string): Promise<void> => {
    await Stories.actions.utils.ignoreECONNREFUSED(
      api.get.bind(null, `/hosts/${host._id}/invites/${inviteId}`, env.getOptions())
    );
  },

  // router.get<IHostFeed>("/hosts/:hid/feed", Hosts.readHostFeed);
  readHostFeed: async (host: IHost): Promise<IHostFeed> => {
    const res = await api.get<IHostFeed>(
      `/hosts/${host._id}/feed?upcoming[page]=0&upcoming[per_page]=4`,
      env.getOptions()
    );
    return res.data;
  },

  // router.put<void>("/hosts/:hid/assets", Hosts.updateHostAssets);
  updateHostAssets: async (host: IHost, data: fd): Promise<void> => {
    const options = env.getOptions();
    options.headers['Content-Type'] = data.getHeaders()['content-type'];
    await api.put<void>(`/hosts/${host._id}/assets?type=image`, data, options);
  },

  // router.put<void>("/hosts/:hid/commission-rate", Hosts.updateCommissionRate);
  updateCommissionRate: async (host: IHost, newRate: number): Promise<void> => {
    await api.put<void>(`/hosts/${host._id}/commission-rate`, { new_rate: newRate }, env.getOptions());
  },

  // router.get<IHostStripeInfo>("/hosts/:hid/stripe/info", Hosts.readStripeInfo);
  readStripeInfo: async (host: IHost): Promise<IHostStripeInfo> => {
    const res = await api.get<IHostStripeInfo>(`/hosts/${host._id}/stripe/info`, env.getOptions());
    return res.data;
  },

  // router.get<IE<IFollower[]>>("/hosts/:hid/followers", Hosts.readHostFollowers);
  readHostFollowers: async (host: IHost): Promise<IFollower[]> => {
    const res = await api.get<IEnvelopedData<IFollower[]>>(`/hosts/${host._id}/followers`, env.getOptions());
    return res.data.data;
  },

  // router.post<void>("/hosts/:hid/toggle-like", Hosts.toggleLike);
  toggleLike: async (host: IHost): Promise<void> => {
    await api.post<void>(`/hosts/${host._id}/toggle-like`, {}, env.getOptions());
  },

  // router.get<DtoUserMarketingInfo>("/hosts/:hid/marketing/audience", Hosts.readHostMarketingConsents);
  readHostMarketingConsents: async (host: IHost): Promise<DtoUserMarketingInfo> => {
    const res = await api.get<DtoUserMarketingInfo>(`/hosts/${host._id}/marketing/audience`, env.getOptions());
    return res.data;
  },

  // router.get<DtoHostAnalytics>("/hosts/:hid/analytics", Hosts.readHostAnalytics);
  readHostAnalytics: async (host: IHost, period: AnalyticsTimePeriod = 'WEEKLY'): Promise<DtoHostAnalytics> => {
    const res = await api.get<DtoHostAnalytics>(`/hosts/${host._id}/analytics?period=${period}`, env.getOptions());
    return res.data;
  },

  // router.get <DtoPerfAnalytics[]>("/hosts/:hid/analytics/performances/all", Hosts.readAllPerformancesAnalytics());
  readAllPerformancesAnalytics: async (
    hostId: string,
    period: AnalyticsTimePeriod = 'WEEKLY'
  ): Promise<DtoPerformanceIDAnalytics[]> => {
    const res = await api.get<DtoPerformanceIDAnalytics[]>(
      `/hosts/${hostId}/analytics/performances/all${querize({ period })}`,
      env.getOptions()
    );
    return res.data;
  },

   // router.get <DtoPerfAnalytics[]>("/hosts/:hid/analytics/performances/all", Hosts.readPerformanceAnalytics());
  readPerformanceAnalytics: async (
    hostId: string,
    performanceId: string,
    period: AnalyticsTimePeriod = 'WEEKLY'
  ): Promise<DtoPerformanceIDAnalytics[]> => {
    const res = await api.get<DtoPerformanceIDAnalytics[]>(
      `/hosts/${hostId}/analytics/performances/${performanceId}${querize({ period })}`,
      env.getOptions()
    );
    return res.data;
  }
};

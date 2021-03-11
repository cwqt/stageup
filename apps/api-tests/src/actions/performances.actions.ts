import { api } from '../environment';
import { environment as env, UserType } from '../environment';
import {
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  CurrencyCode,
  IPerformanceUserInfo,
  IEnvelopedData,
  IHost,
  IHostStub,
  DtoCreatePerformance,
  Visibility,
  Genre,
  hasRequiredHostPermission,
  ITicketStub,
  ITicket,
  Idless,
  DtoCreateTicket
} from '@core/interfaces';
import { timestamp } from '@core/shared/helpers';

export default {
  // router.post<IPerf>("/performances",Perfs.createPerformance());
  createPerformance: async (
    host: IHost | IHostStub,
    data?: DtoCreatePerformance
  ): Promise<IPerformance> => {
    data = data || {
      name: "performance name",
      premiere_date: timestamp(),
      genre: Genre.Allegory,
      description: "some performance",
      price: 10,
      currency: CurrencyCode.GBP
    }

    const res = await api.post(`/hosts/${host._id}/performances`, data, env.getOptions());
    return res.data;
  },

  // router.get<IE<IPerfS[], null>>("/performances",Perfs.readPerformances());
  readPerformances: async (): Promise<IEnvelopedData<IPerformanceStub[], null>> => {
    const res = await api.get(`/performances`, env.getOptions());
    return res.data;
  },

  // router.get<IE<IPerf, IPUInfo>>("/performances/:pid", Perfs.readPerformance());
  readPerformance: async (performance: IPerformance): Promise<IEnvelopedData<IPerformance, IPerformanceUserInfo>> => {
    const res = await api.get(`/performances/${performance._id}`, env.getOptions());
    return res.data;
  },

  // router.get<IPHInfo>("/performances/:pid/host_info", Perfs.readPerformanceHostInfo());
  readPerformanceHostInfo: async (performance: IPerformance): Promise<IPerformanceHostInfo> => {
    const res = await api.get(`/performances/${performance._id}/host_info`, env.getOptions());
    return res.data;
  },

  // router.put<IPerf>("/performance/:pid",Perfs.updatePerformance());
  updatePerformance: async (
    performance: IPerformance,
    data: { name: string; description: string; price: number }
  ): Promise<IPerformance> => {
    const res = await api.put(`/performances/${performance._id}`, data, env.getOptions());
    return res.data;
  },

  // router.post<void>("/performances/:pid/purchase",Perfs.purchase());
  purchase: async (performance: IPerformance): Promise<void> => {
    const res = await api.post(`/performances/${performance._id}/purchase`, performance, env.getOptions());
    return res.data;
  },

  // router.delete <void>("/performance/:pid",Perfs.deletePerformance());
  deletePerformance: async (performance: IPerformance): Promise<void> => {
    const res = await api.delete(`/performances/${performance._id}`, env.getOptions());
    return res.data;
  },

  // router.put <IPerf> ("/performances/:pid/visibility", Perfs.updateVisibility());
  updateVisibility: async (performance: IPerformance, visibility:Visibility): Promise<IPerformance> => {
    const res = await api.put(`/performances/${performance._id}/visibility`, { visibility: visibility }, env.getOptions());
    return res.data;
  },

  // router.post <ITicket> ("/performances/:pid/tickets", Perfs.createTicket());
  createTicket: async (performance:IPerformance, ticket:DtoCreateTicket):Promise<ITicket> => {
    const res = await api.post(`/performances/${performance._id}/tickets`, ticket, env.getOptions());
    return res.data;
  },

  // router.get <ITicketStub[]> ("/performances/:pid/tickets", Perfs.getTickets());
  getTickets: async (performance:IPerformance):Promise<ITicketStub[]> => {
    const res = await api.get(`/performances/${performance._id}/tickets`, env.getOptions());
    return res.data;
  },

  // router.delete <void> ("/performances/:pid/tickets/:tid", Perfs.deleteTicket());
  deleteTicket: async (performance:IPerformance, ticket:ITicket | ITicketStub):Promise<ITicket> => {
    const res = await api.delete(`/performances/${performance._id}/tickets/${ticket._id}`, env.getOptions());
    return res.data;
  }
};

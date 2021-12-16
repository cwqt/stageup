import { timestamp } from '@core/helpers';
import {
  DtoCreateMultipleTickets,
  DtoCreateShowing,
  DtoCreateTicket,
  DtoPerformance,
  DtoPerformanceDetails,
  DtoRemovePerformance,
  Genre,
  IEnvelopedData,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  IShowing,
  ITicket,
  ITicketStub,
  NUUID,
  PerformanceType,
  Visibility
} from '@core/interfaces';
import { Except } from 'type-fest';
import { api, environment as env } from '../environment';

export default {
  // router.post<IPerf>("/hosts/:hid/performances",Perfs.createPerformance());
  createPerformance: async (hostId: string, type: PerformanceType): Promise<IPerformance> => {
    const res = await api.post(`/hosts/${hostId}/performances`, { type }, env.getOptions());
    return res.data;
  },

  //router.put <IPerf> ("/performances/:pid/update", Perfs.updatePerformance())
  updatePerformance: async (performanceId: string, data?: DtoPerformanceDetails): Promise<IPerformance> => {
    const performanceDetails = data || {
      name: 'performance name',
      publicity_period: { start: timestamp(), end: timestamp() + 10000000 },
      genre: Genre.Contemporary,
      short_description: 'some performance',
      visibility: Visibility.Public
    };

    const res = await api.put(`/performances/${performanceId}/update`, performanceDetails, env.getOptions());
    return res.data;
  },

  // router.get<IE<IPerfS[], null>>("/performances",Perfs.readPerformances());
  readPerformances: async (): Promise<IEnvelopedData<IPerformanceStub[], null>> => {
    const res = await api.get(`/performances`, env.getOptions());
    return res.data;
  },

  // router.get<IE<IPerf, IPUInfo>>("/performances/:pid", Perfs.readPerformance());
  readPerformance: async (performance: IPerformance): Promise<DtoPerformance> => {
    const res = await api.get(`/performances/${performance._id}`, env.getOptions());
    return res.data;
  },

  // router.get<IPHInfo>("/performances/:pid/host-info", Perfs.readPerformanceHostInfo());
  readPerformanceHostInfo: async (performance: IPerformance): Promise<IPerformanceHostInfo> => {
    const res = await api.get(`/performances/${performance._id}/host-info`, env.getOptions());
    return res.data;
  },

  // router.put <void>("/performances/:pid",Perfs.softDeletePerformance());
  deletePerformance: async (performance: IPerformance, data: DtoRemovePerformance): Promise<void> => {
    const res = await api.put(`/performances/${performance._id}`, data, env.getOptions());
    return res.data;
  },

  // router.put<void>("/performances/:pid/cancel",Perfs.cancelPerformance());
  cancelPerformance: async (performanceId: string, data: DtoRemovePerformance): Promise<void> => {
    const res = await api.put(`/performances/${performanceId}/cancel`, data, env.getOptions());
    return res.data;
  },

  // router.put<void>("/performances/:pid/restore",Perfs.restorePerformance());
  restorePerformance: async (performanceId: string): Promise<void> => {
    const res = await api.put(`/performances/${performanceId}/restore`, null, env.getOptions());
    return res.data;
  },

  // router.put <IPerf> ("/performances/:pid/visibility", Perfs.updateVisibility());
  updateVisibility: async (performance: IPerformance, visibility: Visibility): Promise<IPerformance> => {
    const res = await api.put(
      `/performances/${performance._id}/visibility`,
      { visibility: visibility },
      env.getOptions()
    );
    return res.data;
  },

  // router.post <ITicket> ("/performances/:pid/tickets", Perfs.createTicket());
  createTicket: async (performance: IPerformance, ticket: DtoCreateTicket): Promise<ITicket> => {
    const res = await api.post(`/performances/${performance._id}/tickets`, ticket, env.getOptions());
    return res.data;
  },

  // router.post<ITicket[]>("/performances/:pid/multiple-tickets", Perfs.createMultipleTickets);
  createMultipleTickets: async (performance: IPerformance, tickets: DtoCreateMultipleTickets): Promise<ITicket[]> => {
    const res = await api.post(`/performances/${performance._id}/multiple-tickets`, tickets, env.getOptions());
    return res.data;
  },

  // router.get <ITicketStub[]> ("/performances/:pid/tickets", Perfs.getTickets());
  getTickets: async (performance: IPerformance): Promise<ITicketStub[]> => {
    const res = await api.get(`/performances/${performance._id}/tickets`, env.getOptions());
    return res.data.data;
  },

  // router.delete <void> ("/performances/:pid/tickets/:tid", Perfs.deleteTicket());
  deleteTicket: async (performance: IPerformance, ticket: ITicket | ITicketStub): Promise<ITicket> => {
    const res = await api.delete(`/performances/${performance._id}/tickets/${ticket._id}`, env.getOptions());
    return res.data;
  },

  // router.get <IEnvelopedData<ITicketStub[], NUUID[]>> ("/performances/:pid/tickets", Perfs.readTickets());
  readTickets: async (performance: IPerformance): Promise<IEnvelopedData<ITicketStub[], NUUID[]>> => {
    const res = await api.get(`/performances/${performance._id}/tickets`, env.getOptions());
    return res.data;
  },

    // router.get <IEnvelopedData<ITicketStub[], NUUID[]>> ("/performances/:pid/tickets", Perfs.readTickets());
  readShowingTickets: async (performance: IPerformance, showing: IShowing): Promise<IEnvelopedData<ITicketStub[], NUUID[]>> => {
    const res = await api.get(`/performances/${performance._id}/tickets?sid=${showing._id}`, env.getOptions());
    return res.data;
  },

  // router.get <ITicket[]> ("/performances/:pid/valid-tickets", Perfs.readTickets());
  readValidTickets: async (performance: IPerformance): Promise<ITicket[]> => {
    const res = await api.get(`/performances/${performance._id}/valid-tickets`, env.getOptions());
    return res.data;
  },

  // router.get <ITicket> ("/performances/:pid/tickets/:tid", Perfs.readTicket());
  readTicket: async (performance: IPerformance, ticket: ITicket | ITicketStub): Promise<ITicket> => {
    const res = await api.get(`/performances/${performance._id}/tickets/${ticket._id}`, env.getOptions());
    return res.data;
  },

  // router.put <ITicket> ("/performances/:pid/tickets/:tid", Perfs.updateTicket());
  updateTicket: async (
    performance: IPerformance,
    ticket: ITicket | ITicketStub,
    data: Partial<Except<DtoCreateTicket, 'type'>>
  ): Promise<ITicket> => {
    const res = await api.put(`/performances/${performance._id}/tickets/${ticket._id}`, data, env.getOptions());
    return res.data;
  },

  //router.put<void>("/performances/:pid/tickets/qty-visibility",Perfs.bulkUpdateTicketQtyVisibility());
  bulkUpdateTicketQtyVisibility: async (performance: IPerformance, isQtyVisible: boolean): Promise<void> => {
    const res = await api.put(
      `/performances/${performance._id}/tickets/qty-visibility"`,
      { is_quantity_visible: isQtyVisible },
      env.getOptions()
    );
    return res.data;
  },

  // router.post<IShowing>("/performances/:pid/showing", Perfs.createShowing);
  createShowing: async (performance: IPerformance, data: DtoCreateShowing): Promise<IShowing> => {
    const res = await api.post(`/performances/${performance._id}/showings`, data, env.getOptions());
    return res.data;
  },

  // router.get<IShowing[]>("/performances/:pid/showings", Perfs.readShowings);
  readShowings: async (performance: IPerformance): Promise<IShowing[]> => {
    const res = await api.get(`/performances/${performance._id}/showings`, env.getOptions());
    return res.data;
  }
};

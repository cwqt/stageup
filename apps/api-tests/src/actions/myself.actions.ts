import { ConsentOpt, ConsentOpts, IFeed, IFollowing, IHost, IMyself, IOptOutReason, IRefundRequest, IUserHostInfo } from "@core/interfaces";
import { api, environment as env } from '../environment';

export default {
  getMyself: async (): Promise<IMyself> => {
    const res = await api.get<IMyself>(`/myself`, env.getOptions());
    return res.data;
  },

  // router.put <IMyself["host_info"]>  ("/myself/landing-page", Users.updatePreferredLandingPage());
  updatePreferredLandingPage: async (
    data: Pick<IUserHostInfo, 'prefers_dashboard_landing'>
  ): Promise<IMyself['host_info']> => {
    const res = await api.put<IMyself['host_info']>(`/myself/landing-page`, data, env.getOptions());
    return res.data;
  },

  //router.get<IFeed>("/myself/feed", Myself.readFeed());
  readFeed: async (): Promise<IFeed> => {
    const res = await api.get<IFeed>(`/myself/feed`, env.getOptions());
    return res.data;
  },

  //router.post<void>("/myself/invoices/request-refund", Myself.requestInvoiceRefund());
  requestInvoiceRefund: async (refundReq: IRefundRequest) => {
    await api.post<void>(`/myself/invoices/request-refund`, refundReq, env.getOptions());
  },

  // router.post<IFollowing>("/myself/follow-host/:hid", Myself.addFollow);
  addFollow: async (host: IHost): Promise<IFollowing> => {
    const res = await api.post<IFollowing>(`/myself/follow-host/${host._id}`, {}, env.getOptions());
    return res.data;
  },

  // router.put<void>("/myself/opt-ins/host-marketing/:hid", Myself.updateHostOptInStatus);
  updateHostOptInStatus: async (host: IHost, newStatus: ConsentOpt, optOutReason?: IOptOutReason) => {
    await api.put<void>(
      `/myself/opt-ins/host-marketing/${host._id}`,
      { new_status: newStatus, opt_out_reason: optOutReason},
      env.getOptions()
    );
  }
}

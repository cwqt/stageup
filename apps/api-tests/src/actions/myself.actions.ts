import { IFeed, IMyself, IRefundRequest, IUserHostInfo } from "@core/interfaces";
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
}
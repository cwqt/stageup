import { IHost, IUser } from '@core/interfaces';
import { api, environment as env } from '../environment';

export default {
  // router.get<string>("utils/password-otp/:uid", Utils.readForgottenPasswordOTP);
  readForgottenPasswordOTP: async (user: IUser): Promise<string> => {
    const res = await api.get<string>(`utils/password-otp/${user._id}`, env.getOptions());
    return res.data;
  },

  // router.get<string>("/utils/host-invite/:iid/:hid", Utils.getHostInvitationId);
  getHostInvitationId: async (invitee: IUser, host: IHost): Promise<string> => {
    const res = await api.get<string>(`/utils/host-invite/${invitee._id}/${host._id}`, env.getOptions());
    return res.data;
  }
}

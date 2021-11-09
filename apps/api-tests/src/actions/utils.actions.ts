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
  },

  ignoreECONNREFUSED: async (f: Function) => {
    try {
      return await f();
    } catch(error) {
      // Expect a redirect error as the front-end is not running during tests
      // If the error is different, throw the error
      if (!error.message.includes('connect ECONNREFUSED')) {
        throw(error);
      }      
    }
  }
}

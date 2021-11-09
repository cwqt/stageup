import { IUser } from '@core/interfaces';
import { api, environment as env } from '../environment';

export default {
  // router.get<string>("utils/password-otp/:uid", Utils.readForgottenPasswordOTP);
  readForgottenPasswordOTP: async (user: IUser): Promise<string> => {
    const res = await api.get<string>(`utils/password-otp/${user._id}`, env.getOptions());
    return res.data;
  }
}

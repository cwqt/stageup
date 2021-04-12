import { api } from '../environment';
import { environment as env } from '../environment';
import {
  IHost,
  IHostStub,
  IUserStub
} from '@core/interfaces';

export default {
  // router.post <void> ("/accept-invite/:uid", Misc.acceptHostInvite());
  async acceptHostInvite(user:IUserStub):Promise<void> {
    const res = await api.post(`/accept-invite/${user._id}`, env.getOptions());
    return res.data;
  },

  // router.get <IHost> ("/verify-host/:hid", Misc.verifyHost());
  async verifyHost(host:IHostStub):Promise<IHost> {
    const res = await api.get(`/verify-host/${host._id}`, env.getOptions());
    return res.data;
  }
}
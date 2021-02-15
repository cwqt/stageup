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
  IUserStub
} from '@core/interfaces';

export default {
  // router.post <void> ("/acceptinvite/:uid", Misc.acceptHostInvite());
  async acceptHostInvite(user:IUserStub):Promise<void> {
    const res = await api.post(`/acceptinvite/${user._id}`, env.getOptions());
    return res.data;
  }
}
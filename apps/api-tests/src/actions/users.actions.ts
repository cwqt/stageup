import { Stories, CachedUser } from '../stories';
import { environment as env, UserType } from '../environment';
import { IMyself, IUser, IAddress, IUserStub, Primitive, IUserHostInfo, IRefundRequest, IFeed } from '@core/interfaces';
import { api } from '../environment';
import userAddressesActions from './user-addresses.actions';
import fd from 'form-data';

export default {
  ...userAddressesActions,

  getMyself: async (): Promise<IMyself> => {
    const res = await api.get<IMyself>(`/myself`, env.getOptions());
    return res.data;
  },

  createUser: async (user: UserType, force: boolean = false): Promise<IMyself['user']> => {
    if (force || !Stories.cachedUsers[user]) {
      const res = await api.post<IMyself['user']>(`/users`, env.userCreationData[user], env.getOptions());
      Stories.cachedUsers[user] = new CachedUser(res.data);
      return res.data;
    } else {
      return Stories.cachedUsers[user]?.user!;
    }
  },

  //router.post <IAddress> ("/users/uid/addresses", Users.createAddress());
  createAddress: async (
    user: IUser,
    data: { city: string; iso_country_code: string; postcode: string; street_name: string; street_number: number }
  ): Promise<IAddress> => {
    const res = await api.post<IAddress>(`/users/${user._id}/addresses`, data, env.getOptions());
    return res.data;
  },

  login: async (user: UserType): Promise<CachedUser> => {
    if (!Stories.cachedUsers[user]) throw Error('User has not been created');

    const res = await api.post<IUser>(
      `/users/login`,
      {
        email_address: env.userCreationData[user].email_address,
        password: env.userCreationData[user].password
      },
      env.getOptions()
    );

    // console.log(`SWITCHED ACTOR: ${env.userActorNameMap[user]} -----------------------------------`);
    Stories.cachedUsers[user]!.session = res.headers['set-cookie'][0].split(';')[0];
    Stories.activeUser = Stories.cachedUsers[user];
    return Stories.cachedUsers[user]!;
  },

  logout: async (): Promise<void> => {
    await api.post(`/users/logout`, null, env.getOptions());

    const cachedUser = Object.values(Stories.cachedUsers).find(u => u?.user._id == Stories.activeUser?.user._id);
    if (cachedUser) cachedUser.session = '';
    Stories.activeUser = null;
  },

  //router.put<IUserS>("/hosts/:uid/avatar", Users.changeAvatar());
  changeAvatar: async (user: IUser, data: fd): Promise<IUserStub> => {
    const options = env.getOptions();
    options.headers['Content-Type'] = data.getHeaders()['content-type'];

    const res = await api.put<IUserStub>(`/users/${user._id}/avatar`, data, options);
    return res.data;
  },

  //router.put  <IMyself["user"]> ("/users/:uid", Users.updateUser());
  updateUser: async (user: IUser, data: { [index: string]: Primitive }): Promise<IMyself['user']> => {
    const res = await api.put<IMyself['user']>(`/users/${user._id}`, data, env.getOptions());
    return res.data;
  },

  // router.put <IMyself["host_info"]>  ("/myself/landing-page", Users.updatePreferredLandingPage());
  updatePreferredLandingPage: async (
    data: Pick<IUserHostInfo, 'prefers_dashboard_landing'>
  ): Promise<IMyself['host_info']> => {
    const res = await api.put<IMyself['host_info']>(`/myself/landing-page`, data, env.getOptions());
    return res.data;
  },

  //router.get<IFeed>("/myself/feed",Myself.readFeed());
  readFeed: async (): Promise<IFeed> => {
    const res = await api.get<IFeed>(`/myself/feed`, env.getOptions());
    return res.data;
  },

  deleteUser: async (user: IUser) => {},

  requestInvoiceRefund: async (refundReq: IRefundRequest) => {
    await api.post<void>(`/myself/invoices/request-refund`, refundReq, env.getOptions());
  }
};

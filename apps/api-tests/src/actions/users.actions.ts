import Axios from 'axios';
import { Stories, CachedUser } from '../stories';
import { environment as env, UserType } from '../environment';
import { IMyself, IUser, IAddress } from '@core/interfaces';
import { api } from '../environment';
import userAddressesActions from './user-addresses.actions';

export default {
  ...userAddressesActions,

  getMyself: async (): Promise<IMyself> => {
    const res = await api.get<IMyself>(`/myself`, env.getOptions());
    return res.data;
  },

  createUser: async (user: UserType, force: boolean = false): Promise<IUser> => {
    if (force || !Stories.cachedUsers[user]) {
      const res = await api.post<IUser>(`/users`, env.userCreationData[user], env.getOptions());
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

  updateUser: async (user: IUser, props: any) => {},

  deleteUser: async (user: IUser) => {}
};

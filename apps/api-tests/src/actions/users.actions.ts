import { IAddress, Idless, IEnvelopedData, IHost, IMyself, IUser, IUserHostInfo, Primitive } from '@core/interfaces';
import fd from 'form-data';
import { api, environment as env, UserType } from '../environment';
import { CachedUser, Stories } from '../stories';

export default {
  createUser: async (user: UserType, force: boolean = false): Promise<IMyself['user']> => {
    if (force || !Stories.cachedUsers[user]) {
      const res = await api.post<IMyself['user']>(`/users`, env.userCreationData[user], env.getOptions());
      Stories.cachedUsers[user] = new CachedUser(res.data);
      return res.data;
    } else {
      return Stories.cachedUsers[user]?.user!;
    }
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

  //router.put<string>("/users/:uid/avatar", Users.changeAvatar());
  changeAvatar: async (user: IUser, data: fd): Promise<string> => {
    const options = env.getOptions();
    options.headers['Content-Type'] = data.getHeaders()['content-type'];

    const res = await api.put<string>(`/users/${user._id}/avatar`, data, options);
    return res.data;
  },

  //router.put  <IMyself["user"]> ("/users/:uid", Users.updateUser());
  updateUser: async (user: IUser, data: { [index: string]: Primitive }): Promise<IMyself['user']> => {
    const res = await api.put<IMyself['user']>(`/users/${user._id}`, data, env.getOptions());
    return res.data;
  },

  //router.post <IAddress> ("/users/uid/addresses", Users.createAddress());
  createAddress: async (user: IUser, data: Idless<IAddress>): Promise<IAddress> => {
    const res = await api.post<IAddress>(`/users/${user._id}/addresses`, data, env.getOptions());
    return res.data;
  },

  //router.get <IAddress[]> ("/users/:uid/addresses", Users.readAddresses());
  readAddresses: async (user: IUser): Promise<IAddress[]> => {
    const res = await api.get<IAddress[]>(`/users/${user._id}/addresses`, env.getOptions());
    return res.data;
  },

  //router.delete <void> ("/users/:uid/addresses/:aid", Users.deleteAddress());
  deleteAddress: async (user: IUser, address: IAddress): Promise<void> => {
    const res = await api.delete(`/users/${user._id}/addresses/${address._id}`, env.getOptions());
    return res.data;
  },

  //router.delete<void>(`/users/:uid`, Users.deleteUser());
  deleteUser: async (user: IUser) => {
    await api.delete<void>(`/users/${user._id}`, env.getOptions());
  },

  //router.get<IUser>(`/users/:uid`, Users.readUser());
  readUser: async(user: IUser): Promise<IUser> => {
    const res = await api.get<IUser>(`/users/${user._id}`, env.getOptions());
    return res.data;
  },

  //router.get<IEnvelopedData<IHost, IUserHostInfo>>(`/users/:uid/host`, Users.readUserHost());
  readUserHost: async (user: IUser): Promise<IEnvelopedData<IHost, IUserHostInfo>> => {
    const res = await api.get<IEnvelopedData<IHost, IUserHostInfo>>(`/users/${user._id}/host`, env.getOptions());
    return res.data;
  },

  //router.post<void>(`/users/forgot-password`, Users.forgotPassword());
  forgotPassword: async (email: string): Promise<void> => {
    await api.post<void>('/users/forgot-password', {email_address: email}, env.getOptions());
  },

  //router.put<void>(`/users/reset-password`, Users.resetForgottenPassword());
  resetForgottenPassword: async (otp: string, new_password: string): Promise<void> => {
    await api.put<void>(`/users/reset-password?otp=${otp}`, { new_password: new_password}, env.getOptions());
  }
};

import Axios from 'axios';
import { Stories, CachedUser } from '../stories';
import { environment as env, UserType } from '../environment';
import { IMyself, IUser, IAddress, Idless } from '@eventi/interfaces';

export default {
  getMyself: async (): Promise<IMyself> => {
    const res = await Axios.get<IMyself>(`${env.baseUrl}/myself`, env.getOptions());
    return res.data;
  },

  createUser: async (user: UserType, force:boolean=false): Promise<IUser> => {
    if (force || !Stories.cachedUsers[user]) {
      const res = await Axios.post<IUser>(`${env.baseUrl}/users`, env.userCreationData[user], env.getOptions());
      Stories.cachedUsers[user] = new CachedUser(res.data);
      return res.data;
    } else {
      return Stories.cachedUsers[user]?.user!;
    }
  },

  //router.post <IAddress> ("/users/uid/addresses", Users.createAddress());
  createAddress: async (user: IUser, data: Idless<IAddress> ): Promise<IAddress> => {
    const res = await Axios.post<IAddress>(`${env.baseUrl}/users/${user._id}/addresses`, data, env.getOptions());
    return res.data;
  },

  //router.get <IAddress[]> ("/users/:uid/addresses", Users.readAddresses());
  readAddresses: async ( user: IUser, data: {} ) => {
    const res = await Axios.get<IAddress[]>(`${env.baseUrl}/users/${user._id}/Addresses`, env.getOptions());
    return res.data[0];    // Temporary Locator
  },

  //router.put <IAddress> ("/users/:uid/addresses/:aid", Users.updateAddress());
  updateAddresses: async(user: IUser, data: Idless<IAddress> ): Promise<IAddress> => {
    const res = await Axios.put<IAddress>(`${env.baseUrl}/users/${user._id}`, data, env.getOptions());
    return res.data;
  },

  //router.delete <void> ("/users/:uid/addresses/:aid", Users.deleteAddress());
  deleteAddresses: async(user : IUser): Promise <void> => {
    const res = await Axios.delete(`${env.baseUrl}/users/${user._id}/addresses/${user._id}`, env.getOptions());
    return res.data;
  },

  login: async (user:UserType): Promise<CachedUser> => {
    if(!Stories.cachedUsers[user]) throw Error("User has not been created");

    const res = await Axios.post<IUser>(`${env.baseUrl}/users/login`, {
      email_address: env.userCreationData[user].email_address,
      password: env.userCreationData[user].password,
    }, env.getOptions());

    console.log(`SWITCHED ACTOR: ${env.userActorMap[user]} -----------------------------------`);   
    Stories.cachedUsers[user]!.session = res.headers['set-cookie'][0].split(";")[0];
    Stories.activeUser = Stories.cachedUsers[user];
    return Stories.cachedUsers[user]!;
  },

  logout: async (): Promise<void> => {
    await Axios.post(`${env.baseUrl}/users/logout`, null, env.getOptions());

    const cachedUser = Object.values(Stories.cachedUsers).find(u => u?.user._id == Stories.activeUser?.user._id);
    if(cachedUser) cachedUser.session = "";
    Stories.activeUser = null;
  },

  updateUser: async (user: IUser, props: any) => {},

  deleteUser: async (user: IUser) => {},
};

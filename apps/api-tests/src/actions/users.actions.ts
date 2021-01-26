import Axios from 'axios';
import { Stories, CachedUser } from '../stories';
import { environment as env, UserType } from '../environment';
import { IMyself, IUser } from '@eventi/interfaces';
import userAddressesActions from './user-addresses.actions';

export default {
  ...userAddressesActions,

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

  login: async (user:UserType): Promise<CachedUser> => {
    if(!Stories.cachedUsers[user]) throw Error("User has not been created");

    const res = await Axios.post<IUser>(`${env.baseUrl}/users/login`, {
      email_address: env.userCreationData[user].email_address,
      password: env.userCreationData[user].password,
    }, env.getOptions());

    // console.log(`SWITCHED ACTOR: ${env.userActorNameMap[user]} -----------------------------------`);   
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

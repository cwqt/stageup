import { Stories, CachedUser } from '../stories';
import Axios from 'axios';
import { environment as env } from '../environment';
import { expect } from 'chai';
import { IMyself, IUser, IUserStub } from '@eventi/interfaces';

export default {
  getMyself: async (): Promise<IMyself> => {
    const res = await Axios.get<IMyself>(`${env.baseUrl}/myself`, env.getOptions());
    return res.data;
  },

  createUser: async (data: { email_address: string; password: string; username: string }): Promise<IUser> => {
    const res = await Axios.post<IUser>(`${env.baseUrl}/users`, data, env.getOptions());
    return res.data;
  },

  login: async (data: { email_address: string; password: string }): Promise<CachedUser> => {
    const res = await Axios.post<IUser>(`${env.baseUrl}/users/login`, data);
    const user = new CachedUser(res.data);
    user.session = res.headers['session.sid'];
    return user;
  },

  logout: async ():Promise<void> => {
    const res = await Axios.post(`${env.baseUrl}/users/logout`, null, env.getOptions());
    return;
  },

  updateUser: async (user: IUser, props: any) => {},

  deleteUser: async (user: IUser) => {},
};

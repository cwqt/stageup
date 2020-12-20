import { environment } from './environment';
import { IUser } from '@eventi/interfaces';

export class CachedUser {
  user: IUser;
  session: string;

  constructor(user:IUser) {
    this.user = user;
    this.session = "";
  }
}

import commonActions from './actions/common.actions';
import usersActions from './actions/users.actions';
import hostsActions from './actions/hosts.actions';

export const Stories = {
  log: true,
  activeUser: null as any,
  actions: {
    common: commonActions,
    users: usersActions,
    hosts: hostsActions
  },

  setActiveUser: async (user: CachedUser) => {
    Stories.activeUser = user;
  },

  getActiveUser: (): CachedUser | null => {
    return Stories.activeUser;
  }
};




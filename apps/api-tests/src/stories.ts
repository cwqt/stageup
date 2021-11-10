import { environment, UserType } from './environment';
import { HostPermission, IMyself, IUser } from '@core/interfaces';

export class CachedUser {
  user: IMyself["user"];
  session: string;

  constructor(user: IMyself["user"]) {
    this.user = user;
    this.session = '';
  }
}

import commonActions from './actions/common.actions';
import usersActions from './actions/users.actions';
import hostsActions from './actions/hosts.actions';
import adminActions from './actions/admin.actions';
import performanceActions from './actions/performances.actions';
import searchActions from './actions/search.actions';
import myselfActions from './actions/myself.actions';
import gdprActions from './actions/gdpr.actions';
import utilsActions from './actions/utils.actions';
import authActions from './actions/auth.actions';

export const Stories = {
  log: true,
  activeUser: null as any,
  cachedUsers: {} as { [index in UserType]?: CachedUser },
  actions: {
    common: commonActions,
    users: usersActions,
    hosts: hostsActions,
    admin: adminActions,
    performances: performanceActions,
    search: searchActions,
    utils: utilsActions,
    myself: myselfActions,
    gdpr: gdprActions,
    auth: authActions
  },

  setActiveUser: async (user: CachedUser) => {
    Stories.activeUser = user;
  },

  getActiveUser: (): CachedUser | null => {
    return Stories.activeUser;
  }
};

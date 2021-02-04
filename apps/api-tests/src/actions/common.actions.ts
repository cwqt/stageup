import { api } from '../environment';
import { Stories } from '../stories';

import { environment as env, environment, UserType } from '../environment';
import { IUser } from '@core/interfaces';

export default {
  /**
   * @description Drops all existing data, creates the admin user & switches to acting as them
   */
  setup: async (): Promise<IUser> => {
    await Stories.actions.common.drop();
    Stories.cachedUsers = {}; //clear user cache
    const admin = await Stories.actions.users.createUser(UserType.SiteAdmin);
    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    return admin;
  },

  /**
   * @description Change who the requests are made as
   */
  switchActor: async (user: UserType) => {
    if (!Stories.cachedUsers[user]) throw new Error(`User ${user} has not been created`);
    if (Stories.activeUser?.session) await Stories.actions.users.logout();
    await Stories.actions.users.login(user);
  },

  /**
   * @description Drop data from all databases
   */
  drop: async () => {
    return api.post('/drop');
  },

  timeout: (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

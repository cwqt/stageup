import { Stories } from '../stories';
import jwt from 'jsonwebtoken';
import Axios from "axios";
import {environment as env, environment, UserType} from "../environment";
import { expect } from 'chai';


export default {
    /**
     * @description Drops all existing data, creates the admin user & switches to acting as them
     */
    setup: async () => {
      await Stories.actions.common.drop();
      await Stories.actions.users.createUser(UserType.SiteAdmin);
      await Stories.actions.common.switchActor(UserType.SiteAdmin);
    },

    /**
     * @description Change who the requests are made as
     */
    switchActor: async (user:UserType) => {
      if(!Stories.cachedUsers[user]) throw new Error(`User ${user} has not been created`);
      if(Stories.activeUser?.session) await Stories.actions.users.logout();
      await Stories.actions.users.login(user);
    },

    /**
     * @description Drop data from all databases
     */
    drop: async () => {
      await Axios.post(`${env.baseUrl}/drop`);
    },

    timeout: (ms:number) =>  {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
};
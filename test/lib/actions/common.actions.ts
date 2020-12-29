import { Stories } from '../stories';
import jwt from 'jsonwebtoken';
import Axios from "axios";
import {environment as env, environment} from "../environment";
import { expect } from 'chai';


export default {
    // changeActiveUser: async (user:UserRole) => {
    //     if(user == UserRole.LoggedOut) {
    //         Stories.activeUser = UserRole.LoggedOut;
    //     } else if(Stories.globals[Global.USERS][user]) {
    //         Stories.activeUser = user;
    //     } else {
    //         //user not exist, create them
    //         Stories.activeUser = user;
    //         Stories.globals[Global.USERS][user] = {
    //             user: {},
    //             token: "",
    //             permissions: environment.users[user].permissions
    //         }
    //         await Stories.actions.common.getToken(user);
    //         await Stories.actions.users.getCurrentUser();    
    //     }
    // },

    // getToken: async (user:UserRole) => {
    //     let res = await Axios.post(`${env.baseUrl}/api/test/token`, { username: env.users[user]?.email, password: env.users[user]?.password });
    //     expect(res.status).to.be.eq(200);
    //     Stories.getCachedUser(user).token = res.data;
    // },

    // /**
    //  * @description Clears all MongoDB data & logs in as EnvAdmin
    //  */
    // setUp: async () => {
    //     Stories.clearVars();
    //     await Axios.put(`${env.baseUrl}/api/test/drop`);
    //     await Stories.actions.common.changeActiveUser(UserRole.EnvAdmin);
    //     validateUserToken(UserRole.EnvAdmin);
    // },

    timeout: (ms:number) =>  {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
};
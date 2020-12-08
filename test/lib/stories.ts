import { UserRole, environment } from './environment';

import { commonActions } from './actions/common.actions';
import { usersActions } from './actions/users.actions';

import { IUser } from '@eventi/interfaces';

export interface CachedUser {
    user: IUserModel,
    token: string
    permissions:{[index:string]:boolean}
}

export enum Global {
    USERS = 'users',
}

export const Stories = {
    log: true,
    // verify: verify,
    activeUser: UserRole.LoggedOut,
    actions: {
        common: commonActions,
        users: usersActions,
    },
    globals: {
        [Global.USERS]: {
            [UserRole.LoggedOut]: {
                user: {},
                token: "",
                permissions: environment.users[UserRole.LoggedOut].permissions
            }
        } as {[index in UserRole]?:CachedUser},
    } as {[index in Global]:any},

    setUser: (user:UserRole, data:IUserModel) => { Stories.globals[Global.USERS][user].user = data; },

    getActiveUser: ():CachedUser => {
        if(!Stories.globals[Global.USERS][Stories.activeUser]) throw new Error(`User ${Stories.activeUser} not cached, must be created first`)
       
        return Stories.globals[Global.USERS][Stories.activeUser];
    },

    getCachedUser: (user:UserRole):CachedUser => {
        if(!Stories.globals[Global.USERS][user]) throw new Error('User not cached, must be created first')
        return Stories.globals[Global.USERS][user];
    },

    unsetGlobal:(group:Global, id:string) => {
        delete Stories.globals[group][id];
    },

    clearVars: () => {
        Stories.globals = {
            [Global.USERS]: {
                [UserRole.LoggedOut]: {
                    user: {},
                    token: "",
                    permissions: environment.users[UserRole.LoggedOut].permissions
                }
            } as {[index in UserRole]?:CachedUser},
        } as {[index in Global]:any};
        Stories.activeUser = UserRole.LoggedOut;
    },
};


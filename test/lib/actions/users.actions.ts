import { Stories, Global } from '../stories';
import Axios from "axios";
import { environment, UserRole } from "../environment";
import { expect } from 'chai';
import { IUser, IUserStub } from '@eventi/interfaces';

export const usersActions = {
    getMyself: async (user:IUser | IUserStub, props:any) => {

    },
    
    createUser: async (props:any):Promise<IUser> => {
        let res = await Axios.post<IUser>(`${environment.baseUrl}/api/adminuser`, props, {
            headers: {
                "Authorization": 'bearer ' + Stories.getActiveUser().token,
                "Content-Type": 'application/json'
            },
            data: props
        });

        return res.data;
    },

    updateUser: async (user:UserRole, props: any) => {
    },

    deleteUser: async (user:UserRole) => {
    },
};
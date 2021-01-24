import { describe, it } from 'mocha';
import {
    IHost,
    IUser,
    IUserHostInfo
} from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { expect } from 'chai';

describe('As a user-host, I want to be able to do Member CRUD', async () => {
    let host: IHost;
    let member: IUser;
    let client: IUser;

      
        
    it('Should add an existing user as member of host', async () => {
        client = await Stories.actions.users.createUser(UserType.Client);
        await Stories.actions.common.switchActor(UserType.Client)
        await Stories.actions.common.setup();
        host = await Stories.actions.hosts.createHost({
          username: 'somecoolhost',
          name: 'Some Cool Host',
          email_address: 'host@cass.si',
        });
            
        await Stories.actions.hosts.addUser(host);
        
            
        
    });



    
    it('Should remove a member of host', async () => {
        await Stories.actions.hosts.removeHostMember(host, member);    
    
    });

    
    
    it('Should update a member permission', async () => {
        await Stories.actions.hosts.updateHostMember(host, member);
       
    
    
     });

})
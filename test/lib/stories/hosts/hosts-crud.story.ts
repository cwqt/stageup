import { describe, it } from 'mocha';
import {
    IHost,
    IUser,
} from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { expect } from 'chai';

describe("As an admin, I want to be able to do Host Crud", async () => {
    let host: IHost;
    let client: IUser;
    
    it('Should create a host', async () => {
        client = await Stories.actions.users.createUser(UserType.Client);
        await Stories.actions.common.switchActor(UserType.Client)
        await Stories.actions.common.setup();
        host = await Stories.actions.hosts.createHost({
          username: 'somecoolhost',
          name: 'Some Cool Host',
          email_address: 'host@cass.si',
        });
             
    }); 

    it('Should delete a host', async () => {
        await Stories.actions.hosts.deleteHost(host);
        
    }); 

    it('Should read host details', async () => {
        let readHost = await Stories.actions.hosts.readHost(host);
        expect (readHost.name).to.equal(host.name);
        expect(readHost.username).to.equal(host.username);
        expect(readHost._id).to.equal(host._id);

    });
});
    
    


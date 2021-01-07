import { describe, it } from 'mocha';
import {
    IHostOnboarding,
    IHost,
} from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { expect } from 'chai';

describe("verify the Onboarding process pulls in the host relationship", async () => {
    let host: IHost;
    
    it('Onboarding process has a "host" field inside of it', async () => {
        await Stories.actions.common.setup();
        host = await Stories.actions.hosts.createHost({
            username: 'somecoolhost',
            name: 'Some Cool Host',
            email_address: 'host@cass.si',
        });
        let onboarding = await Stories.actions.hosts.readOnboardingProcessStatus(host);
        expect(onboarding.host).to.exist;
    }); 
    
});
    
    


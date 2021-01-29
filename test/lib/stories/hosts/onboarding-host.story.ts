import { describe, it } from 'mocha';
import {
    IHostOnboarding,
    IHost,
    IUser,
    IHostOnboardingProcess,
} from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { expect } from 'chai';

describe("Verify the Onboarding process pulls in the host relationship", async () => {
    let host: IHost;
    let client: IUser;
    let onboarding:IHostOnboarding;
    
    it('Onboarding process has a "host" field inside of it', async () => {
        await Stories.actions.common.setup();
        client = await Stories.actions.users.createUser(UserType.Client);
        await Stories.actions.common.switchActor(UserType.Client)
        
        host = await Stories.actions.hosts.createHost({
            username: 'somecoolhost',
            name: 'Some Cool Host',
            email_address: 'host@cass.si',
        });

        onboarding = await Stories.actions.hosts.readOnboardingProcessStatus(host);

        expect(onboarding.host).to.exist;
        expect(onboarding.created_at).to.exist;
        expect(onboarding.last_modified).to.exist;
        expect(onboarding.last_modified_by._id).to.eq(client._id);
        expect(onboarding.last_modified_by.name).to.eq(client.name);
        expect(onboarding.last_modified_by.username).to.eq(client.username);
    }); 
});
    
    

    let onboarding = await Stories.actions.hosts.readOnboardingProcessStatus(host);
    expect(onboarding.host).to.exist;
    expect(onboarding.created_at).to.exist;
    expect(onboarding.last_modified).to.exist;
    expect(onboarding.last_modified_by._id).to.eq(client._id);
    expect(onboarding.last_modified_by.name).to.eq(client.name);
    expect(onboarding.last_modified_by.username).to.eq(client.username);
  });
});

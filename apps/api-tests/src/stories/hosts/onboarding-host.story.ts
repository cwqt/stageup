import {
    IHostOnboarding,
    IHost,
    IUser
} from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';

describe("Verify the Onboarding process pulls in the host relationship", () => {
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

        expect(onboarding.host).toBeDefined;
        expect(onboarding.created_at).toBeDefined;
        expect(onboarding.last_modified).toEqual;
        expect(onboarding.last_modified_by._id).toEqual(client._id);
        expect(onboarding.last_modified_by.name).toEqual(client.name);
        expect(onboarding.last_modified_by.username).toEqual(client.username);
    }); 
});

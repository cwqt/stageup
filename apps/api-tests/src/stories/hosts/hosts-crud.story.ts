import { IHost } from '@core/interfaces';
import { Stories } from '../../stories';

describe('As a user-host, I want to be able to do Host CRUD', () => {
  let host: IHost;

  it('Should create a host', async () => {
    await Stories.actions.common.setup();
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si'
    });

    // TODO: assert host pulls in relationship of member
    // members = await Stories.actions.hosts.readMembers(host);
    // expect(members.find(user => user._id === createdUser._id));
  });

  it('Should read the host by id & username', async () => {
    await Stories.actions.hosts.readHost(host);
    await Stories.actions.hosts.readHostByUsername(host);
  });
});

import { describe, it } from 'mocha';
import { HostPermission, IHost, IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';

describe('As a user-host, I want to be able to do Member CRUD', async () => {
  let host: IHost;
  let member: IUser;

  it('Should add an existing user as member of host', async () => {
    // Create a host as a site admin
    await Stories.actions.common.setup();
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si',
    });

    // Then create a new user, and add them to the host
    member = await Stories.actions.users.createUser(UserType.Member);
    await Stories.actions.hosts.addMember(host, member);
  });

  it('Should update a member permission', async () => {
    await Stories.actions.hosts.updateMember(host, member, { value: HostPermission.Editor });
  });

  it('Should remove a member of host', async () => {
    await Stories.actions.hosts.removeMember(host, member);
  });
});

import { ErrCode, HostPermission, HTTP, IEnvelopedData, IErrorResponse, IHost, IMUXAsset, IMyself, IUser, IUserHostInfo, IUserStub } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import axios, { AxiosError, AxiosResponse } from 'axios';

describe('As a user-host, I want to be able to do Member CRUD', () => {
  let host: IHost;
  let member: IMyself["user"];
  let members: IEnvelopedData<IUserHostInfo[]>;
  let createdUser: IUser;

  it('Should add an existing user as member of host', async () => {
    createdUser = await Stories.actions.common.setup();
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si'
    });

    // Create user, add to host & assert they were added to the DB
    member = await Stories.actions.users.createUser(UserType.Member);
    await Stories.actions.hosts.addMember(host, member);
    await Stories.actions.misc.acceptHostInvite(member);
    members = await Stories.actions.hosts.readMembers(host);

    expect(members.data.find(uhi => uhi.user._id === member._id)).toBeDefined();
  });

  it('Should update a member permission (promote)', async () => {
    // Update member, read host, find member & assert their perms are what we set
    await Stories.actions.hosts.updateMember(host, member, { value: HostPermission.Editor });
    host = await Stories.actions.hosts.readHost(host);
    let memberCheck = host.members_info.find(user => user.user._id === member._id);
    expect(memberCheck.permissions).toBe(HostPermission.Editor);
  });

  it('Should update a member permission (demote)', async () => {
    // Update member, read host, find member & assert their perms are what we set
    await Stories.actions.hosts.updateMember(host, member, { value: HostPermission.Member });
    host = await Stories.actions.hosts.readHost(host);
    let memberCheck = host.members_info.find(user => user.user._id === member._id);
    expect(memberCheck.permissions).toBe(HostPermission.Member);
  });

  it('Should ensure there cannot be more than one Host Owner of a host', async () => {
    try {
      await Stories.actions.hosts.updateMember(host, member, { value: HostPermission.Owner });
    } catch (error) {
      // Should throw as cannot be more than 1 owner at a time
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.Unauthorised);
    }
  });

  it('Should ensure a Host Admin cannot demote an Host Owner', async () => {
    // Update member to admin, switch to acting as them & then try to demote the owner, which should fail
    await Stories.actions.hosts.updateMember(host, member, { value: HostPermission.Admin });
    await Stories.actions.common.switchActor(UserType.Member);
    try {
      await Stories.actions.hosts.updateMember(host, Stories.cachedUsers[UserType.SiteAdmin].user, {
        value: HostPermission.Member
      });
    } catch (error) {
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.Unauthorised);
    }
  });

  it('Should ensure an Host Admin cannot remove an Owner', async () => {
    // Switch to Member (who has been promoted to an Admin)
    await Stories.actions.common.switchActor(UserType.Member);
    await Stories.actions.hosts.updateMember(host, member, { value: HostPermission.Admin });
    try {
      await Stories.actions.hosts.removeMember(host, Stories.cachedUsers[UserType.SiteAdmin].user);
    } catch (error) {
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.Unauthorised);
    }
  });

  it('Should remove a member of host', async () => {
    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    await Stories.actions.hosts.removeMember(host, member);
    host = await Stories.actions.hosts.readHost(host);
    expect(host.members_info.find(user => user.user._id === member._id)).toBeUndefined();
  });
});

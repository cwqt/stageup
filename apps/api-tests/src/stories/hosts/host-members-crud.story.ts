import { HostPermission, HTTP, IEnvelopedData, IErrorResponse, IHost, IMyself, IUser, IUserHostInfo, IUserStub } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { HostInvitation } from '@core/api';

describe('As a user-host, I want to be able to do Member CRUD', () => {
  let host: IHost;
  let member: IMyself['user'];
  let members: IEnvelopedData<IUserHostInfo[]>;
  let createdUser: IUser;

  it('Should add an existing user as member of host', async () => {
    createdUser = await Stories.actions.common.setup();
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host+test@stageup.uk'
    });

    // Create user, add to host & assert they were added to the DB
    member = await Stories.actions.users.createUser(UserType.Member);
    await Stories.actions.hosts.addMember(host, member);

    members = await Stories.actions.hosts.readMembers(host);
    expect(members.data.find(uhi => uhi.user._id === member._id)).toBeDefined();
  });

  it('Should accept host invite', async () => {
    const hostInvitationId = await Stories.actions.utils.getHostInvitationId(member, host);
    await Stories.actions.common.switchActor(UserType.Member);
    await Stories.actions.hosts.handleHostInvite(host, hostInvitationId);
  });

  it('Should update a member permission (promote)', async () => {
    // Update member, read host, find member & assert their perms are what we set
    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    await Stories.actions.hosts.updateMember(host, member, { value: HostPermission.Editor });
    members = await Stories.actions.hosts.readMembers(host);
    let memberCheck = members.data.find(user => user.user._id === member._id);
    expect(memberCheck.permissions).toBe(HostPermission.Editor);
  });

  it('Should update a member permission (demote)', async () => {
    // Update member, read host, find member & assert their perms are what we set
    await Stories.actions.hosts.updateMember(host, member, { value: HostPermission.Member });
    members = await Stories.actions.hosts.readMembers(host);
    let memberCheck = members.data.find(user => user.user._id === member._id);
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
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.Forbidden);
    }
  });

  it('Should remove a member of host', async () => {
    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    await Stories.actions.hosts.removeMember(host, member);
    members = await Stories.actions.hosts.readMembers(host);
    expect(members.data.find(user => user.user._id === member._id)).toBeUndefined();
  });
});

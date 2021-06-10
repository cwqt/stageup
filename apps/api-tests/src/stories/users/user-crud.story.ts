import { Genre, IFeed, IHost, IHostStub, IMyself, IPerformanceStub, IUser, Visibility } from '@core/interfaces';
import { Stories } from '../../stories';
import fd from 'form-data';
import { createReadStream } from 'fs';
import { mock } from 'jest-mock-extended';

describe('As a user, I want to be able to CRUD', () => {
  let user: IUser;

  it('Should create a user', async () => {
    user = await Stories.actions.common.setup();
    let host = await Stories.actions.hosts.createHost({
      username: 'hostname',
      name: 'host name',
      email_address: 'host@name.com'
    });

    let perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Test perf',
      premiere_datetime: 1844172702,
      description: 'Test description',
      genre: Genre.Dance,
      type: 'vod'
    });

    await Stories.actions.performances.updateVisibility(perf, Visibility.Public);
  });

  it('Should get the newly created user', async () => {});

  it('Should update host members preferred landing page', async () => {
    // by default is true
    let myself = await Stories.actions.users.getMyself();
    expect(myself.host_info.prefers_dashboard_landing).toEqual(true);

    // set to false
    await Stories.actions.users.updatePreferredLandingPage({ prefers_dashboard_landing: false });
    myself = await Stories.actions.users.getMyself();
    expect(myself.host_info.prefers_dashboard_landing).toEqual(false);
  });

  it('Should delete a user', async () => {});

  it("Should return the user's feed", async () => {
    let feed: IFeed = await Stories.actions.users.readFeed();
    expect(feed.everything.data[0].name).toBe('Test perf');
    expect(feed.upcoming.data[0].name).toBe('Test perf');
    expect(feed.hosts.data[0].name).toBe('host name');
  });

  it('Should upload a profile picture to AWS S3 and check for a returned object URL', async () => {
    const filePath = require('path').join(__dirname, `./../../../assets/cat.jpg`);
    const form = new fd();
    form.append('file', createReadStream(filePath));

    const u = await Stories.actions.users.changeAvatar(user, form);
    expect(typeof u.avatar).toEqual('string');
  });
});
function IEnvelopedData<T>(): any {
  throw new Error('Function not implemented.');
}

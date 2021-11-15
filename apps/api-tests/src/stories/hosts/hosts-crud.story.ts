import { IHost, IUser } from '@core/interfaces';
import { Stories } from '../../stories';
import { createReadStream } from "fs";
import fd from "form-data";
import { UserType } from '../../environment';

describe('As a user-host, I want to be able to do Host CRUD', () => {
  let host: IHost;
  let client: IUser & {email_address: string};

  beforeAll(async () => {
    await Stories.actions.common.setup();
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host+test@stageup.uk'
    });

    client = await Stories.actions.users.createUser(UserType.Client);
  });

  it('Should read the host by id & username', async () => {
    const readHost = await Stories.actions.hosts.readHost(host);
    expect(readHost.data.username).toEqual('somecoolhost');

    const readHostByUsername = await Stories.actions.hosts.readHostByUsername(host);
    expect(readHostByUsername.data.name).toEqual('Some Cool Host');
  });

  it('Should read host details', async () => {
    const hostPrivateDetails = await Stories.actions.hosts.readHostDetails(host);
    expect(hostPrivateDetails.email_address).toEqual('host+test@stageup.uk');
  });

  it('Should upload a host banner to Google cloud and check for a returned object URL', async () => {
    const filePath = require('path').join(__dirname, `./../../../assets/cat.jpg`);
    const form = new fd();
    form.append('file', createReadStream(filePath));

    const bannerUrl = await Stories.actions.hosts.changeBanner(host, form);
    expect(typeof bannerUrl).toEqual("string");
    expect(bannerUrl.includes('https://storage.cloud.google.com/')).toBe(true);
    expect(bannerUrl.includes('.jpg')).toBe(true);
  });

  it('Should upload a profile picture to Google Cloud Storage and check for a returned object URL', async () => {
    const filePath = require('path').join(__dirname, `./../../../assets/cat.jpg`);
    const form = new fd();
    form.append('file', createReadStream(filePath));

    const avatarUrl = await Stories.actions.hosts.changeAvatar(host, form);
    expect(typeof avatarUrl).toEqual("string");
    expect(avatarUrl.includes('https://storage.cloud.google.com/')).toBe(true);
    expect(avatarUrl.includes('.jpg')).toBe(true);
  });

  it('should update commission rate', async () => {
    await Stories.actions.hosts.updateCommissionRate(host, 0.2);
    const hostDetails = await Stories.actions.hosts.readHostDetails(host);
    expect(hostDetails.commission_rate).toEqual(0.2);
  });

  it('Should update host assets', async () => {
    const filePath = require('path').join(__dirname, `./../../../assets/cat.jpg`);
    const form = new fd();
    form.append('file', createReadStream(filePath));

    await Stories.actions.hosts.updateHostAssets(host, form);

    const readHost = await Stories.actions.hosts.readHost(host);

    expect(readHost.data.assets[0].type).toEqual('image');
    expect(readHost.data.assets[0].tags[0]).toEqual('thumbnail');
    expect(readHost.data.assets[0].location.includes('.jpg')).toBe(true);
  });

  it('Should read followers', async () => {
    await Stories.actions.common.switchActor(UserType.Client);
    await Stories.actions.myself.addFollow(host);

    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    const followers = await Stories.actions.hosts.readHostFollowers(host);
    
    expect(followers[0].user__id).toEqual(client._id);
  });

  it('Should toggle like', async () => {
    await Stories.actions.common.switchActor(UserType.Client);
    
    // Like
    await Stories.actions.hosts.toggleLike(host);
    let readHost = await Stories.actions.hosts.readHost(host);
    expect(readHost.__client_data.is_liking).toBe(true);

    // Dislike
    await Stories.actions.hosts.toggleLike(host);
    readHost = await Stories.actions.hosts.readHost(host);
    expect(readHost.__client_data.is_liking).toBe(false);

    await Stories.actions.common.switchActor(UserType.SiteAdmin);
  });

  it('Should read host marketing consent', async () => {
    await Stories.actions.common.switchActor(UserType.Client);
    await Stories.actions.myself.updateHostOptInStatus(host, 'hard-in');

    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    const consent = await Stories.actions.hosts.readHostMarketingConsents(host);
    expect(consent.data[0].email_address).toEqual(client.email_address);
  });

  // TODO: extend the test below with usable analytics data
  it('Should read host analytics', async () => {
    await Stories.actions.utils.addHostAnalytics(host);

    // await Stories.actions.common.switchActor(UserType.SiteAdmin);
    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    const hostAnalytics = await Stories.actions.hosts.readHostAnalytics(host, 'YEARLY');
    expect(typeof hostAnalytics).toBe('object')
    expect(hostAnalytics.name).toEqual(host.name);
    expect(hostAnalytics.chunks.length).toBe(1);
    expect(hostAnalytics.chunks[0]).toHaveProperty('period_ended_at');
    expect(hostAnalytics.chunks[0]).toHaveProperty('metrics');
    expect(hostAnalytics.chunks[0].metrics).toHaveProperty('performances_created');
    expect(hostAnalytics.chunks[0].metrics.performances_created).toBe(10);
  })

  it('Should delete host', async () => {
    await Stories.actions.hosts.deleteHost(host);
  });
});

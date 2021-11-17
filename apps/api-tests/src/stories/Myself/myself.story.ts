import { Genre, IFeed, IUser, PerformanceType, Visibility } from '@core/interfaces';
import { Stories } from '../../stories';

describe('Pull in the feed...', () => {
  let user: IUser;

  beforeAll(async () => {
    user = await Stories.actions.common.setup();
    let host = await Stories.actions.hosts.createHost({
      username: 'hostname',
      name: 'host name',
      email_address: 'host@name.com'
    });

    let perf = await Stories.actions.performances.createPerformance(host._id, PerformanceType.Vod);
    const performanceDetails = {
      name: 'Test perf',
      short_description: 'Test description',
      long_description: 'Long test description',
      genre: Genre.Dance,
      publicity_period: { start: 161347834, end: 161347834 },
      visibility: Visibility.Public
    };
    perf = await Stories.actions.performances.updatePerformance(perf._id, performanceDetails);

    await Stories.actions.performances.updateVisibility(perf, Visibility.Public);
  });

  it('Should get the feed', async () => {
    let feed: IFeed = await Stories.actions.users.readFeed();
    expect(feed.everything.data[0].name).toBe('Test perf');
    expect(feed.upcoming.data[0].name).toBe('Test perf');
    expect(feed.hosts.data[0].name).toBe('host name');
  });

  it('Should update host members preferred landing page', async () => {
    // by default is true
    let myself = await Stories.actions.users.getMyself();
    expect(myself.host_info.prefers_dashboard_landing).toEqual(true);

    // set to false
    await Stories.actions.users.updatePreferredLandingPage({ prefers_dashboard_landing: false });
    myself = await Stories.actions.users.getMyself();
    expect(myself.host_info.prefers_dashboard_landing).toEqual(false);
  });
});

import { Genre, IFeed, IUser, Visibility } from '@core/interfaces';
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

    let perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Test perf',
      premiere_datetime: 1844172702,
      description: 'Test description',
      genre: Genre.Dance,
      type: 'vod'
    });

    await Stories.actions.performances.updateVisibility(perf, Visibility.Public);
  });

  it('Should get the feed', async () => {
    let feed: IFeed = await Stories.actions.users.readFeed();
    expect(feed.everything.data[0].name).toBe('Test perf');
    expect(feed.upcoming.data[0].name).toBe('Test perf');
    expect(feed.hosts.data[0].name).toBe('host name');
  });
});
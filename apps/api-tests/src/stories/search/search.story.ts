import { IHost, IPerformance, IUser, CurrencyCode, Genre, PerformanceType, Visibility } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { timestamp } from '@core/helpers';

describe('As a user, I want to be able to search for hosts/performances', () => {
  let host: IHost;
  let perf: IPerformance;
  let client: IUser;
  let page: 0;
  let perPage: 10;

  it('Should create a host and performance', async () => {
    await Stories.actions.common.setup();
    client = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);

    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'somecoolhost',
      email_address: 'host+test@stageup.uk'
    });

    perf = await Stories.actions.performances.createPerformance(host._id, PerformanceType.Vod);
    const performanceDetails = {
      name: 'Shakespeare',
      short_description: 'To be or not to be',
      long_description: 'That is the question',
      genre: Genre.Dance,
      publicity_period: { start: timestamp(), end: timestamp() + 10000000 },
      visibility: Visibility.Public
    };
    perf = await Stories.actions.performances.updatePerformance(perf._id, performanceDetails);
  });

  it('Should search for host', async () => {
    let searchQuery = host.name;
    let hostResults = await Stories.actions.search.search(searchQuery, page, perPage);
    expect(hostResults.hosts.data.find(host => host.name === host.name));
  });

  it('Should search for performance', async () => {
    let searchQuery = perf.name;
    let perfResults = await Stories.actions.search.search(searchQuery, page, perPage);
    expect(perfResults.performances.data.find(performance => perf.name === performance.name));
  });
});

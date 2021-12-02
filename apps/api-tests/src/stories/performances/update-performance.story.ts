import { IHost, IPerformance, IUser, PerformanceType, Visibility } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { CurrencyCode, Genre } from '@core/interfaces';
import { timestamp } from '@core/helpers';

describe('As a user-host, I want to update a performace details', () => {
  let perf: IPerformance;
  let client: IUser;
  let host: IHost;

  it('Should update a performance', async () => {
    await Stories.actions.common.setup();
    client = await Stories.actions.users.createUser(UserType.Client);
    await Stories.actions.common.switchActor(UserType.SiteAdmin);

    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
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

    const updatePerf = await Stories.actions.performances.updatePerformance(perf._id, {
      name: 'Othello',
      short_description: 'For she had eyes and chose me.',
      long_description: 'That is the question',
      genre: Genre.Dance,
      publicity_period: { start: timestamp(), end: timestamp() + 10000000 },
      visibility: Visibility.Public
    });

    expect(updatePerf.name).toBe('Othello');
    expect(updatePerf.short_description).toBe('For she had eyes and chose me.');
  });
});

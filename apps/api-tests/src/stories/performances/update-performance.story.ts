import { IHost, IPerformance, IUser } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { CurrencyCode, Genre } from '@core/interfaces';

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
      email_address: 'host@cass.si'
    });

    perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Shakespeare',
      description: 'To be or not to be',
      genre: Genre.BourgeoisTragedy,
      premiere_date: null
    });

    const updatePerf = await Stories.actions.performances.updatePerformance(perf, {
      name: 'Othello',
      description: 'For she had eyes and chose me.',
    });

    expect(updatePerf.name).toBe('Othello');
    expect(updatePerf.description).toBe('For she had eyes and chose me.');
  });
});

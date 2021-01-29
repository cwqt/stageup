import { ErrCode, HTTP, IErrorResponse, IHost, IPerformance, IUser, CurrencyCode } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { AxiosError } from 'axios';

describe('As a user, I want to be able to do performance CRUD', () => {
  let host: IHost;
  let perf: IPerformance;
  let client: IUser;

  it('Should create a performance and get the newly created performance', async () => {
    await Stories.actions.common.setup();

    client = await Stories.actions.users.createUser(UserType.Client);
    await Stories.actions.common.switchActor(UserType.Client);
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si'
    });

    perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Shakespeare',
      description: 'To be or not to be',
      price: 24,
      currency: CurrencyCode.GBP
    });

    expect(perf).not.toBeNull();
    expect(perf.name).toBe('Shakespeare');
    expect(perf.description).toBe('To be or not to be');
    expect(perf.price).toBe(24);
    expect(perf.currency).toBe(CurrencyCode.GBP);
  });

  it('Should update a performance', async () => {
    const updatePerf = await Stories.actions.performances.updatePerformance(perf, {
      name: 'Othello',
      description: 'For she had eyes and chose me.',
      price: 24
    });

    expect(updatePerf.name).toBe('Othello');
    expect(updatePerf.description).toBe('For she had eyes and chose me.');
    expect(updatePerf.price).toBe(24);
  });

  it('Should delete a performance', async () => {
    await Stories.actions.performances.deletePerformance(perf);
    try {
      // this should definitely throw a 404 because of the prior delete
      const p = await Stories.actions.performances.readPerformance(perf);
      expect(p).toBeNull();
    } catch (error) {
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.NotFound);
    }
  });
});

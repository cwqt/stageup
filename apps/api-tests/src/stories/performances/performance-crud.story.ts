import {
  HTTP,
  IErrorResponse,
  IHost,
  IPerformance,
  IUser,
  CurrencyCode,
  Genre,
  Visibility,
  PerformanceType
} from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { AxiosError } from 'axios';
import { timestamp } from '@core/helpers';

describe('As a user, I want to be able to do performance CRUD', () => {
  let host: IHost;
  let perf: IPerformance;
  let client: IUser;

  it('Should create a performance and get the newly created performance', async () => {
    await Stories.actions.common.setup();

    client = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host+test@stageup.uk'
    });

    perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Shakespeare',
      description: 'To be or not to be',
      genre: Genre.Dance,
      type: PerformanceType.Vod,
      publicity_period: { start: timestamp(), end: timestamp() + 10000000 },
    });

    expect(perf).not.toBeNull();
    expect(perf.name).toBe('Shakespeare');
    expect(perf.description).toBe('To be or not to be');
  });

  it('Should read a performance', async () => {
    let p = await Stories.actions.performances.readPerformance(perf);
    expect(p).not.toBeNull();
    //assert relationship pulled in
    expect(p.data.host.username).toEqual(host.username);
  });

  it('Should update a performance', async () => {
    const updatePerf = await Stories.actions.performances.updatePerformance(perf, {
      name: 'Othello',
      description: 'For she had eyes and chose me.'
    });

    expect(updatePerf.name).toBe('Othello');
    expect(updatePerf.description).toBe('For she had eyes and chose me.');
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

import { HTTP, IErrorResponse, IHost, IPerformance, IUser, CurrencyCode, Genre, Visibility } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { AxiosError } from 'axios';

describe('As a user, I want to be able to do gdpr CRUD', () => {
  let host: IHost;
  let perf: IPerformance;
  let client: IUser;
  let consent: any;

  it('Should attempt to read host-marketing consents from a new user', async () => {
    await Stories.actions.common.setup();

    client = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);

    consent = await Stories.actions.gdpr.readUserHostConsents();
    console.log(consent);

    // expect(perf.description).toBe('To be or not to be');
  });

  //   it('Should read a performance', async () => {
  //     let p = await Stories.actions.performances.readPerformance(perf);
  //     expect(p).not.toBeNull();
  //     //assert relationship pulled in
  //     expect(p.data.host.username).toEqual(host.username);
  //   });

  //   it('Should update a performance', async () => {
  //     const updatePerf = await Stories.actions.performances.updatePerformance(perf, {
  //       name: 'Othello',
  //       description: 'For she had eyes and chose me.'
  //     });

  //     expect(updatePerf.name).toBe('Othello');
  //     expect(updatePerf.description).toBe('For she had eyes and chose me.');
  //   });

  //   it('Should delete a performance', async () => {
  //     await Stories.actions.performances.deletePerformance(perf);
  //     try {
  //       // this should definitely throw a 404 because of the prior delete
  //       const p = await Stories.actions.performances.readPerformance(perf);
  //       expect(p).toBeNull();
  //     } catch (error) {
  //       expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.NotFound);
  //     }
  //   });
});

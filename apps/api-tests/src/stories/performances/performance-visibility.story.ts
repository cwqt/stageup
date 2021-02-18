import {
  ErrCode,
  HTTP,
  IErrorResponse,
  IHost,
  IPerformance,
  IUser,
  CurrencyCode,
  Genre,
  Visibility,
  IMyself
} from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { AxiosError } from 'axios';

describe('As a user, I want to be able to do performance CRUD', () => {
  let host: IHost;
  let perf: IPerformance;
  let client: IUser;
  let editor: IMyself["user"];

  it('Should create a performance and get the newly created performance', async () => {
    await Stories.actions.common.setup();
    client = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si'
    });

    perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Shakespeare',
      description: 'To be or not to be',
      price: 24,
      currency: CurrencyCode.GBP,
      genre: Genre.BourgeoisTragedy,
      premiere_date: null
    });
  });

  describe('Should test performance visibility', () => {
    it('Should assert that the performance is initially set to being Private', async () => {
      expect(perf.visibility).toEqual(Visibility.Private);
    });

    it('Should NOT allow an Admin to update a performance until they have been onboarded', async () => {
      try {
        await Stories.actions.performances.updateVisibility(perf, Visibility.Public);
        throw Error('Should not have thrown this');
      } catch (error) {
        expect(error.response.status).toEqual(HTTP.Unauthorised);
      }

      // Onboard the host using the testing method for the next test
      host = await Stories.actions.misc.verifyHost(host);
    });

    it('Should allow an Admin to update a performance to be Public now they are onboarded', async () => {
      perf = await Stories.actions.performances.updateVisibility(perf, Visibility.Public);
      expect(perf.visibility).toEqual(Visibility.Public);
    });

    it('Should NOT allow an Editor to update a performance to now be Private', async () => {
      editor = await Stories.actions.users.createUser(UserType.Editor);
      await Stories.actions.hosts.addMember(host, editor);
      await Stories.actions.misc.acceptHostInvite(editor);
      await Stories.actions.common.switchActor(UserType.Editor);

      try {
        perf = await Stories.actions.performances.updateVisibility(perf, Visibility.Private);
        throw Error('Should not have thrown this');
      } catch (error) {
        expect(error.response.status).toEqual(HTTP.Unauthorised);
        expect(error.response.data.message).toEqual(ErrCode.MISSING_PERMS);
      }
    });
  });
});

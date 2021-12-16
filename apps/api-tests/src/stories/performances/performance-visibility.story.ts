import {
  HTTP,
  IHost,
  IPerformance,
  IUser,
  CurrencyCode,
  Genre,
  Visibility,
  IMyself,
  PerformanceType
} from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { timestamp } from '@core/helpers';

describe('As a user, I want to be able to do performance CRUD', () => {
  let host: IHost;
  let perf: IPerformance;
  let owner: IMyself['user'];
  let editor: IMyself['user'];

  it('Should create a performance and get the newly created performance', async () => {
    await Stories.actions.common.setup();

    // Create new user so we're not acting as a Site Admin
    owner = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);

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
      ticket_publicity_period: { start: timestamp(), end: timestamp() + 10000000 },
      visibility: Visibility.Private
    };
    perf = await Stories.actions.performances.updatePerformance(perf._id, performanceDetails);

    editor = await Stories.actions.users.createUser(UserType.Editor);
  });

  describe('Should test users trying to view a performane', () => {
    it('Should allow a host member to view a private performance', async () => {
      await Stories.actions.performances.readPerformance(perf);
    });

    // readPerformance is currently used by hosts to read a performance and therefore is not dependent on visbility
    // TODO: It may be worth making a separate endpoint for hosts and users with readPerformance (i.e. for users it will contain information relating to likes, follows etc. whereas for hosts it will contain the general details and is still visibile even when private)
    // it('Should NOT allow a user to view a private perfrormance', async () => {
    //   await Stories.actions.common.switchActor(UserType.Editor);
    //   try {
    //     await Stories.actions.performances.readPerformance(perf);
    //     throw Error('Should not have thrown this');
    //   } catch (error) {
    //     expect(error.response.status).toEqual(HTTP.NotFound);
    //   }
    //   await Stories.actions.common.switchActor(UserType.Owner);
    // });
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
      host = await Stories.actions.hosts.onboardHost(host);
    });

    it('Should allow an Admin to update a performance to be Public now they are onboarded', async () => {
      perf = await Stories.actions.performances.updateVisibility(perf, Visibility.Public);
      expect(perf.visibility).toEqual(Visibility.Public);
    });

    it('Should NOT allow an Editor to update a performance to now be Private', async () => {
      await Stories.actions.hosts.addMember(host, editor);
      const hostInvitationId = await Stories.actions.utils.getHostInvitationId(editor, host);
      await Stories.actions.common.switchActor(UserType.Editor);
      await Stories.actions.hosts.handleHostInvite(host, hostInvitationId);

      try {
        perf = await Stories.actions.performances.updateVisibility(perf, Visibility.Private);
        throw Error('Should not have thrown this');
      } catch (error) {
        expect(error.response.status).toEqual(HTTP.Unauthorised);
        expect(error.response.data.code).toEqual('@@error.missing_permissions');
      }
    });
  });
});

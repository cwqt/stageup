import {
  IHost,
  IPerformance,
  Genre,
  Visibility,
  IMyself,
  PerformanceType,
  PerformanceStatus,
  RemovalType,
  RemovalReason,
  DtoPerformance,
  DtoPerformanceDetails,
  HTTP
} from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { timestamp } from '@core/helpers';

let host: IHost;
let perf: IPerformance;
let owner: IMyself['user'];
let performanceDetails: DtoPerformanceDetails;

describe('As a user, I want to be able to manage the status of my performance', () => {
  beforeAll(async () => {
    await Stories.actions.common.setup();
    owner = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);

    host = await Stories.actions.hosts.createOnboardedHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host+test@stageup.uk'
    });

    performanceDetails = {
      name: 'Shakespeare',
      short_description: 'To be or not to be',
      long_description: 'That is the question',
      genre: Genre.Dance,
      publicity_period: { start: timestamp(), end: timestamp() + 10000000 }, // Set future schedule
      visibility: Visibility.Public
    };
  });

  it('Should create a performance', async () => {
    perf = await Stories.actions.performances.createPerformance(host._id, PerformanceType.Vod);

    expect(perf.host._id).toBe(host._id);
    expect(perf).toHaveProperty('created_at');
  });

  it('Should have initial state of "draft"', async () => {
    expect(perf.status).toBe(PerformanceStatus.Draft);
    expect(perf.name).toBeNull();
    expect(perf.visibility).toBe(Visibility.Private);
  });

  // TODO: Soon when we implement showings, there will be a new status for 'Pending Tickets'
  // This will then need updating since schedule will be related to whether the host has specified show times or not
  it('Should have state of "pending_schedule" (when no publicity_period is been set)', async () => {
    performanceDetails.publicity_period = { start: null, end: null }; // no publicity period set

    perf = await Stories.actions.performances.updatePerformance(perf._id, performanceDetails);
    expect(perf.status).toBe(PerformanceStatus.PendingSchedule);
    expect(perf.name).toBe('Shakespeare');
  });

  // TODO: Again, see above comment
  it('Should have state of "Scheduled" when the user has specified a date', async () => {
    performanceDetails.publicity_period = { start: timestamp() + 10000000, end: timestamp() + 20000000 }; // Set in the future

    perf = await Stories.actions.performances.updatePerformance(perf._id, performanceDetails);
    expect(perf.status).toBe(PerformanceStatus.Scheduled);
    // Should now appear in the feed
    const feed = await Stories.actions.myself.readFeed();
    expect(feed.everything.data.length).toBe(1);
  });

  describe('As a user, I want to cancel and restore a performance', () => {
    let performance: DtoPerformance;
    it('Should cancel a performance', async () => {
      const cancellationReason = {
        removal_reason: {
          removal_reason: RemovalReason.Covid19,
          further_info: 'Had to cancel due to covid restrictions'
        },
        removal_type: RemovalType.Cancel
      };

      const response = await Stories.actions.performances.cancelPerformance(perf._id, cancellationReason);
    });

    it('Should not display cancelled performance in the feed', async () => {
      // Cancelled performances should NOT be shown in the feed.
      const feed = await Stories.actions.myself.readFeed();
      expect(feed.everything.data.length).toBe(0);
    });

    it('Should have a status of "Cancelled"', async () => {
      // Check performance status is 'cancelled'
      performance = await Stories.actions.performances.readPerformance(perf);
      expect(performance.data.status).toBe(PerformanceStatus.Cancelled);
    });

    it('Should restore it', async () => {
      await Stories.actions.performances.restorePerformance(perf._id);
      performance = await Stories.actions.performances.readPerformance(perf);
      expect(performance.data.status).toBe(PerformanceStatus.PendingSchedule);
      expect(performance.data.publicity_period.start).toBe(null);
    });
  });

  describe('As a user, I want to delete a performance', () => {
    let performance: DtoPerformance;
    it('Should cancel a performance', async () => {
      const deletionReason = {
        removal_reason: {
          removal_reason: RemovalReason.Covid19,
          further_info: 'Had to cancel due to covid restrictions'
        },
        removal_type: RemovalType.SoftDelete
      };

      const response = await Stories.actions.performances.deletePerformance(perf, deletionReason);
    });

    it('Should not display cancelled performance in the feed', async () => {
      // Cancelled performances should NOT be shown in the feed.
      const feed = await Stories.actions.myself.readFeed();
      expect(feed.everything.data.length).toBe(0);
    });

    it('Should fail to read deleted performance', async () => {
      try {
        performance = await Stories.actions.performances.readPerformance(perf);
        throw Error('Should not have thrown this');
      } catch (error) {
        expect(error.response.status).toEqual(HTTP.NotFound);
        expect(error.response.data.code).toEqual('@@error.not_found');
      }
    });

    it('Should fail to restore deleted performance', async () => {
      try {
        await Stories.actions.performances.restorePerformance(perf._id);
        throw Error('Should not have thrown this');
      } catch (error) {
        expect(error.response.status).toEqual(HTTP.NotFound);
        expect(error.response.data.code).toEqual('@@error.not_found');
      }
    });
  });
});

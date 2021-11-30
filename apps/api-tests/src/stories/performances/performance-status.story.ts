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
  DtoPerformanceDetails
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

    // owner = await Stories.actions.users.createUser(UserType.Owner);

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

      await Stories.actions.performances.cancelPerformance(perf._id, cancellationReason);

      // Check it is hidden from the feed
      const feed = await Stories.actions.myself.readFeed();
      expect(feed.everything.data.length).toBe(0);

      // Check performance status is 'cancelled'
      performance = await Stories.actions.performances.readPerformance(perf);
      expect(performance.data.status).toBe(PerformanceStatus.Cancelled);
    });

    it('Should restore it', async () => {
      await Stories.actions.performances.restorePerformance(perf._id);
      performance = await Stories.actions.performances.readPerformance(perf);
      expect(performance.data.status).toBe(PerformanceStatus.PendingSchedule);
    });
  });
});

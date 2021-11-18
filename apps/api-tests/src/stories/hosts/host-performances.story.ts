import { IHost, IPerformance, IUser, PerformanceType, Visibility } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { CurrencyCode, Genre } from '@core/interfaces';
import { date } from 'superstruct';
import { timestamp } from '@core/helpers';
import moment from 'moment';

//router.get <IE<IPerformance[], null>> ("/hosts/:hid/performances", Hosts.readHostPerformances());
describe('As a user-host, I want to review all my performances', () => {
  let perf: IPerformance;
  let client: IUser;
  let host: IHost;

  it('Should list all performaces in a host', async () => {
    await Stories.actions.common.setup();
    client = await Stories.actions.users.createUser(UserType.Client);
    await Stories.actions.common.switchActor(UserType.SiteAdmin);

    host = await Stories.actions.hosts.createOnboardedHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host+test@stageup.uk'
    });

    perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Shakespeare',
      description: 'To be or not to be',
      genre: Genre.Classical,
      type: PerformanceType.Vod,
      publicity_period: { start: timestamp(), end: timestamp() + 10000000 }
    });

    let performancesList = await Stories.actions.hosts.readHostPerformances(host);
    const hostPerformances = performancesList.data[0];

    expect(host).not.toBeNull();
    expect(host.username).toBe('somecoolhost');
    expect(host.name).toBe('Some Cool Host');

    expect(perf).not.toBeNull();
    expect(perf.name).toBe('Shakespeare');
    expect(perf.description).toBe('To be or not to be');

    expect(performancesList).not.toBeNull();
    expect(performancesList.data[0].host._id).toEqual(host._id);
    expect(hostPerformances.name).toEqual(perf.name);
    expect(hostPerformances.description).toEqual(perf.description);
  });

  // TODO: extend the test below with usable analytics data
  it('Should read performance analytics', async () => {
    await Stories.actions.utils.addPerformanceAnalytics(perf);

    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    let performanceAnalytics = await Stories.actions.hosts.readAllPerformancesAnalytics(host._id, 'YEARLY');
    expect(performanceAnalytics.length).toBe(1); // Just one performance
    expect(performanceAnalytics[0].performanceId).toEqual(perf._id);
    expect(performanceAnalytics[0].chunks.length).toBe(20); // 20 chunks
    expect(performanceAnalytics[0].chunks[0]).toHaveProperty('period_ended_at');
    expect(performanceAnalytics[0].chunks[0]).toHaveProperty('metrics');
    expect(performanceAnalytics[0].chunks[0].metrics).toHaveProperty('total_ticket_sales');
    expect(performanceAnalytics[0].chunks[0].metrics.total_ticket_sales).toBe(50);
    expect(performanceAnalytics[0].chunks[0].metrics.total_revenue).toBe(500);
    expect(performanceAnalytics[0].chunks[0].metrics.trailer_views).toBe(100);
    expect(performanceAnalytics[0].chunks[0].metrics.performance_views).toBe(42);
    expect(performanceAnalytics[0].chunks[0].metrics.average_watch_percentage).toBe(0);

    // Test different periods (each period will have the number of weeks * 2 number of chunks)
    performanceAnalytics = await Stories.actions.hosts.readAllPerformancesAnalytics(host._id, 'WEEKLY');
    expect(performanceAnalytics[0].chunks.length).toBe(2);
    performanceAnalytics = await Stories.actions.hosts.readAllPerformancesAnalytics(host._id, 'MONTHLY');
    expect(performanceAnalytics[0].chunks.length).toBe(8);
    performanceAnalytics = await Stories.actions.hosts.readAllPerformancesAnalytics(host._id, 'QUARTERLY');
    expect(performanceAnalytics[0].chunks.length).toBe(20);
  });

  // TODO: Once the showings logic is implemented fix the issue of premiere_date is not set
  // Or do what the proper fix will be then

  // it('Should read host feed', async () => {
  //   await Stories.actions.performances.updateVisibility(perf, Visibility.Public);

  //   const feed = await Stories.actions.hosts.readHostFeed(host);
  //   console.log(feed.data.upcoming.data);
  // });

  it('Should connect to stripe', async () => {
    const link = await Stories.actions.hosts.connectStripe(host);
    const stripeInfo = await Stories.actions.hosts.readStripeInfo(host);
  });

  it('Should read invoices', async () => {});
});

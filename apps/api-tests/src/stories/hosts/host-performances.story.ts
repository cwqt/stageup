import { IHost, IPerformance, IUser, PerformanceType, Visibility } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { CurrencyCode, Genre } from '@core/interfaces';
import { date } from 'superstruct';
import { timestamp } from '@core/helpers';

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
        publicity_period: { start: 1667360800, end: 1667300555 }
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

  it('Should read invoices', async () => {
    
  });
});

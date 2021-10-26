import { IHost, IPerformance, IUser, PerformanceType } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { CurrencyCode, Genre } from '@core/interfaces';

//router.get <IE<IPerformance[], null>> ("/hosts/:hid/performances", Hosts.readHostPerformances());
describe('As a user-host, I want to review all my performances', () => {  
  let perf: IPerformance;
  let client: IUser;
  let host: IHost;  
    
  it('Should list all performaces in a host', async () => {
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
          genre: Genre.Classical,
          type: PerformanceType.Vod,
          publicity_period: { start: 161347834, end: 161347834 }
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
  
});
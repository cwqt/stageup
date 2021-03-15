import { 
    IHost, 
    IPerformance, 
    IUser, 
    CurrencyCode, 
    Genre   
 } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';


describe('As a user, I want to be able to search for hosts/performances', () => {
  let host: IHost;
  let perf: IPerformance;
  let client: IUser;
  let page: 0;
  let perPage: 10
  
  
  it('Should create a host and performance', async () => {
    await Stories.actions.common.setup();
    client = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);

    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'somecoolhost',
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

    expect(perf).not.toBeNull();
    expect(perf.name).toBe('Shakespeare');
    expect(perf.description).toBe('To be or not to be');
    expect(perf.price).toBe(24);
    expect(perf.currency).toBe(CurrencyCode.GBP);
    });  

  it('Should search for host', async () => {
    let searchQuery = host.name;

    await Stories.actions.common.setup();
    client = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);
    let hostResults = await Stories.actions.search.searchResponse(searchQuery, page, perPage);    
    expect(hostResults.hosts.data.find(host => host.name === host.name));

    });
    
  it('Should search for performance', async () => {
    let searchQuery = perf.name;

    await Stories.actions.common.setup();
    client = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);    
    let perfResults = await Stories.actions.search.searchResponse(searchQuery, page, perPage);    
    expect(perfResults.performances.data.find(performance => perf.name === performance.name));

    });

});

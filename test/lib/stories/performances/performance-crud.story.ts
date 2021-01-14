import Axios from 'axios';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { IHost, IPerformance, IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { environment, UserType } from '../../environment';
import { performance } from 'perf_hooks';
import { CurrencyCode } from '@eventi/interfaces/lib/Common/Currency.types';


describe('As a user, I want to be able to do performance CRUD', async () => {
  let host: IHost;
  let perf: IPerformance;
  let client: IUser;
  

  it('Should create a performance and get the newly created performance', async () => {
    
    client = await Stories.actions.users.createUser(UserType.Client);
    await Stories.actions.common.switchActor(UserType.Client)
    await Stories.actions.common.setup();
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si',
    });
        
    let perf = await Stories.actions.performances.createPerformance({
      name: "Shakespeare",
      description: "To be or not to be.",
      price: 24,
      currency: CurrencyCode.GBP
   
    });
    
    expect(perf).to.not.be.null;
    expect(perf.name).to.be.eq("Shakespeare");
    expect(perf.description).to.be.eq("To be or not to be");
    expect(perf.price).to.be.eq(24);
    expect(perf.currency).to.be.eq(CurrencyCode.GBP);    
    
  });



  it('Should delete a performance', async () => {
    let perf = await Stories.actions.performances.createPerformance({
      name: "Shakespeare",
      description: "To be or not to be.",
      price: 24,
      currency: CurrencyCode.GBP
   
    });
    
      let delPerf = await Stories.actions.performances.deletePerformance(perf._id);
      expect (delPerf._id).to.not.exist;    

  });
        
});

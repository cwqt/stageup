import Axios from 'axios';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { IHost, IPerformance, IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { environment, UserType } from '../../environment';
import { performance } from 'perf_hooks';
import { CurrencyCode } from '@eventi/interfaces/lib/Common/Currency.types';


describe('As a user, I want to be able to do purchase performance', async () => {
  let host: IHost;
  let perf: IPerformance;
  let client: IUser;
  

  it('Should purchase a performance', async () => {
    
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
      currency: "GBP"
   
    });

      let purchPerf = await Stories.actions.performances.purchase(perf._id);
      expect(purchPerf.currency).to.be.equal(perf.currency);
    
  });

});
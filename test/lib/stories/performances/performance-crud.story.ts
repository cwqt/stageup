import Axios from 'axios';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { IHost, IPerformance, IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { environment, UserType } from '../../environment';
import { performance } from 'perf_hooks';


describe('As a user, I want to be able to do performance CRUD', async () => {
  let user: IUser;
  let host: IHost;
  let perf: IPerformance;

  it('Should create a performance', async () => {
    
    var client = await Stories.actions.users.createUser(UserType.Client);
    await Stories.actions.common.switchActor(UserType.Client)
    await Stories.actions.common.setup();
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si',
    });
        
    var perfo = await Stories.actions.performances.createPerformance(name);

    expect(perfo).to.not.be.null;

    expect(perfo._id).to.be.eq(perf._id);
  });

  it('Should get the newly created performance', async () => {});

  it('Should update a performance & ensure only certain fields can be modified', async () => {});

  it('Should delete a performance', async () => {});


});

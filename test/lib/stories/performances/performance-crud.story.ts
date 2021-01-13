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
    perf = await Stories.actions.performances.createPerformance(name);

    expect(perf).to.not.be.null;

    expect(perf).to.be.eq(environment.userCreationData[UserType.Client].username);
  });

  it('Should get the newly created performance', async () => {});

  it('Should update a performance & ensure only certain fields can be modified', async () => {});

  it('Should delete a performance', async () => {});


});

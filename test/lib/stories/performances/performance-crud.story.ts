import Axios from 'axios';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { IHost, IPerformance, IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { environment, UserType } from '../../environment';

describe('As a user, I want to be able to do performance CRUD', async () => {
  let user: IUser;
  let host: IHost;
  let perf: IPerformance;

  it('Should create a performance', async () => {
    user = await Stories.actions.users.createUser(UserType.Client);

    expect(user).to.not.be.null;
    expect(user.username).to.be.eq(environment.userCreationData[UserType.Client].username);
  });

  it('Should get the newly created performance', async () => {});

  it('Should update a performance & ensure only certain fields can be modified', async () => {});

  it('Should delete a performance', async () => {});


});

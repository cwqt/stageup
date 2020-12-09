import Axios from 'axios';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { IHost, IPerformance, IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';

describe('As a user, I want to be able to CRUD', async () => {
  let user: IUser;
  let host: IHost;
  let perf: IPerformance;

  it('Should create a user', async () => {
    user = await Stories.actions.users.createUser({
      username: 'cass',
      email_address: 'm@cass.si',
      password: 'helloworld',
    });

    expect(user).to.not.be.null;
    expect(user.name).to.be.eq('cass');
    expect(user.email_address).to.be.eq('m@cass.si');
  });

  it('Should get the newly created user', async () => {});

  it('Should update a user & ensure only certain fields can be modified', async () => {});

  it('Should delete a user', async () => {});
});

describe('Error checking for user CRUD', async () => {
  let user: IUser;

  it('Should not allow me to create an account with a pre-existing username/email-address', async () => {
    user = await Stories.actions.users.createUser({
      username: 'cass',
      email_address: 'm@cass.si',
      password: 'helloworld',
    });
  });
});

import Axios from 'axios';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';

describe('As a user, I want to be able to CRUD', async () => {
  let user: IUser;

  it('Should create a user', async () => {
    await Stories.actions.common.setup();
    user = await Stories.actions.users.createUser(UserType.Member);

    expect(user).to.not.be.null;
    expect(user.name).to.be.eq('cass');
  });

  it('Should get the newly created user', async () => {});

  it('Should update a user & ensure only certain fields can be modified', async () => {});

  it('Should delete a user', async () => {});
});

describe('Error checking for user CRUD', async () => {
  let user: IUser;

  it('Should not allow me to create an account with a pre-existing username/email-address', async () => {
    try {
      user = await Stories.actions.users.createUser(UserType.Member, true);
    } catch (error) {
      expect(error).to.exist;
    }
  });
});

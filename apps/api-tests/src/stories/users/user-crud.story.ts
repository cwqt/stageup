import { expect } from 'chai';
import { IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { environment, UserType } from '../../environment';

describe('As a user, I want to be able to CRUD', () => {
  let user: IUser;

  it('Should create a user', async () => {
    await Stories.actions.common.setup();
    user = await Stories.actions.users.createUser(UserType.Client);

    expect(user).to.not.be.null;
    expect(user.username).to.be.eq(environment.userCreationData[UserType.Client].username);
  });

  it('Should get the newly created user', async () => {});

  it('Should update a user & ensure only certain fields can be modified', async () => {});

  it('Should delete a user', async () => {});
});

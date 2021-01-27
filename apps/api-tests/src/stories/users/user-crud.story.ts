import { IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { environment, UserType } from '../../environment';

describe('As a user, I want to be able to CRUD', () => {
  let user: IUser;

  it('Should create a user', async () => {
<<<<<<< HEAD:apps/api-tests/src/stories/users/user-crud.story.ts
    await Stories.actions.common.setup();
=======
<<<<<<< HEAD
    await Stories.actions.common.setup();
    user = await Stories.actions.users.createUser(UserType.Member);
=======
>>>>>>> 892bedca0a09761bd2f0b196a88ab10c774bd8c5:test/lib/stories/users/user-crud.story.ts
    user = await Stories.actions.users.createUser(UserType.Client);
>>>>>>> 2468c0ad38103338f62b6653bf8912dd1b9cb703

    expect(user).not.toBeNull();
    expect(user.username).toBe(environment.userCreationData[UserType.Client].username);
  });

  it('Should get the newly created user', async () => {});

  it('Should update a user & ensure only certain fields can be modified', async () => {});

  it('Should delete a user', async () => {});
});
<<<<<<< HEAD

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
=======
>>>>>>> 2468c0ad38103338f62b6653bf8912dd1b9cb703

import { IUser } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';

describe('As a user, I want to be able to CRUD', () => {
  let user: IUser;
  let userAdmin: IUser;
  
  it('Should create an admin user & a register a user', async () => {
      await Stories.actions.common.setup();
      user = await Stories.actions.users.createUser(UserType.Client);
      await Stories.actions.common.switchActor(UserType.Client);
      
    expect(user).not.toBeNull;
    expect(user.username).toEqual('hostclient');

   });

    it('Should get the newly created user', async () => {});

    it('Should update a user & ensure only certain fields can be modified', async () => {});

    it('Should delete a user', async () => {});
});


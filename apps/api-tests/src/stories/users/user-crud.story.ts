import { IUser } from '@core/interfaces';
import { Stories } from '../../stories';
import { environment, UserType } from '../../environment';
import fd from 'form-data';
import { createReadStream } from 'fs';

describe('As a user, I want to be able to CRUD', () => {
  let user: IUser;

  it('Should create a user', async () => {
    await Stories.actions.common.setup();
    user = await Stories.actions.users.createUser(UserType.Client);

    expect(user).not.toBeNull;
    expect(user.username).toEqual(environment.userCreationData[UserType.Client].username);
  });

  it('Should get the newly created user', async () => {});

  it('Should update a user & ensure only certain fields can be modified', async () => {});

  it('Should delete a user', async () => {});

  it('Should upload a profile picture to AWS S3 and check for a returned object URL', async () => {
    const filePath = require('path').join(__dirname, `./../../../assets/cat.jpg`);
    const form = new fd();
    form.append('file', createReadStream(filePath));

    const u = await Stories.actions.users.changeAvatar(user, form);
    expect(typeof u.avatar).toEqual("string");
  })
});

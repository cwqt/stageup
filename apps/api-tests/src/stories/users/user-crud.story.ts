import { IMyself, IUser } from '@core/interfaces';
import { Stories } from '../../stories';
import { environment, UserType } from '../../environment';
import fd from 'form-data';
import { createReadStream } from 'fs';

describe('As a user, I want to be able to CRUD', () => {
  let user: IUser;
    
  it('Should create a user', async () => {
    user = await Stories.actions.common.setup();
    await Stories.actions.hosts.createHost({
      username: "hostname",
      name: "host name",
      email_address:"host@name.com"
    })
  });

  it('Should get the newly created user', async () => {});

  it('Should update host members preferred landing page', async () => {
    // by default is true
    let myself = await Stories.actions.users.getMyself();
    expect(myself.host_info.prefers_dashboard_landing).toEqual(true);

    // set to false
    await Stories.actions.users.updatePreferredLandingPage({ prefers_dashboard_landing: false });
    myself = await Stories.actions.users.getMyself();
    expect(myself.host_info.prefers_dashboard_landing).toEqual(false);
  });

  it('Should delete a user', async () => {});

  it('Should upload a profile picture to AWS S3 and check for a returned object URL', async () => {
    const filePath = require('path').join(__dirname, `./../../../assets/cat.jpg`);
    const form = new fd();
    form.append('file', createReadStream(filePath));

    const u = await Stories.actions.users.changeAvatar(user, form);
    expect(typeof u.avatar).toEqual("string");
  })
});

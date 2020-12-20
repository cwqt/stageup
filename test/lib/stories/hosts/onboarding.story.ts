// create user admin
// create user client
// create host
// complete steps of onboarding process
// submit onboarding
// verify onboarding
// done

import { describe, it } from 'mocha';
import { IHost, IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';

describe('As a user, I want to be able to CRUD', async () => {
  let client: IUser;
  let admin:IUser;
  let host:IHost;

  it('Should create an admin user & a client user', async () => {
    admin = await Stories.actions.users.createUser({
      username: 'cass',
      email_address: 'm@cass.si',
      password: 'helloworld',
    });

    client = await Stories.actions.users.createUser({
      username: 'someone',
      email_address: 'someone@cass.si',
      password: 'helloworld',
    });
  });

  it('Client user should register a host', async () => {
    host = await Stories.actions.hosts.createHost({
      username: "somecoolhost",
      name: "Some Cool Host",
      email_address: "host@cass.si"
    })
  });

  it('Should get the created onboarding process', async () => {
    let onboarding = await Stories.actions.hosts.readOnboardingProcessStatus(host);
  })

  it('Host should fill out every section of the onboarding process', async () => {

  });

  it('Should delete a user', async () => {});
});

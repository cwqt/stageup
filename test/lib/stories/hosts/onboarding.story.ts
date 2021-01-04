// create user admin
// create user client
// create host
// complete steps of onboarding process
// submit onboarding
// verify onboarding
// done

import { describe, it } from 'mocha';
import { HostOnboardingStep, IHost, IUser } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { expect } from 'chai';

describe('As a user, I want to be able to CRUD', async () => {
  let client: IUser;
  let admin: IUser;
  let host: IHost;

  it('Should create an admin user & a client user', async () => {
    await Stories.actions.common.setup();
    admin = Stories.cachedUsers[UserType.SiteAdmin]!.user;
    client = await Stories.actions.users.createUser(UserType.Client);
  });

  it('Client user should register a host', async () => {
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si',
    });
  });

  it('Should get the created onboarding process', async () => {
    let onboarding = await Stories.actions.hosts.readOnboardingProcessStatus(host);
    expect(Object.keys(onboarding.steps)).to.be.lengthOf(5);
    expect(onboarding.last_modified_by._id).to.eq(admin._id);
  });

  it("Should update the Proof Of Business section", async () => {
    let proofOfBusiness = await Stories.actions.hosts.updateOnboardingProcessStep(host, HostOnboardingStep.ProofOfBusiness, {
      business_address: {
        city: 'Cardiff',
        iso_country_code: 'GBR',
        postcode: 'NE62 5DE',
        street_name: 'Marquee Court',
        street_number: 32,
      },
      business_contact_number: '+447625143141',
      hmrc_company_number: 11940210,
    });

    console.log(proofOfBusiness)
  })

  it('Host should fill out every section of the onboarding process', async () => {});

  it('Should delete a user', async () => {});
});

// create user admin
// create user client
// create host
// complete steps of onboarding process
// submit onboarding
// verify onboarding
// done

import { describe, it } from 'mocha';
import {
  HostOnboardingStep,
  HostSubscriptionLevel,
  IHost,
  IOnboardingAddMembers,
  IOnboardingOwnerDetails,
  IOnboardingSocialPresence,
  IOnboardingSubscriptionConfiguration,
  IPerson,
  IUser,
  PersonTitle,
} from '@eventi/interfaces';
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

  it('Should update the Proof Of Business section', async () => {
    let proofOfBusiness = await Stories.actions.hosts.updateOnboardingProcessStep(
      host,
      HostOnboardingStep.ProofOfBusiness,
      {
        business_address: {
          city: 'Cardiff',
          iso_country_code: 'GBR',
          postcode: 'NE62 5DE',
          street_name: 'Marquee Court',
          street_number: 32,
        },
        business_contact_number: '+447625143141',
        hmrc_company_number: 11940210,
      }
    );
  });

  it('Should update the Owner Details step', async () => {
    let ownerDetails = await Stories.actions.hosts.updateOnboardingProcessStep<IOnboardingOwnerDetails>(
      host,
      HostOnboardingStep.OwnerDetails,
      {
        owner_info: {
          title: PersonTitle.Mr,
          first_name: 'Drake',
          last_name: 'Drakeford',
        },
      }
    );
  });

  it('Should update the Social Presence step', async () => {
    let socialPresence = await Stories.actions.hosts.updateOnboardingProcessStep<IOnboardingSocialPresence>(
      host,
      HostOnboardingStep.SocialPresence,
      {
        social_info: {
          linkedin_url: 'https://linkedin.com/eventi',
          facebook_url: 'https://facebook.com/eventi',
          instagram_url: 'https://instagram.com/eventi',
        },
      }
    );
  });

  it('Should update the Add Members step', async () => {
    let addMemberStep = await Stories.actions.hosts.updateOnboardingProcessStep<IOnboardingAddMembers>(
      host,
      HostOnboardingStep.AddMembers,
      {
        members_to_add: [
          {
            user_id: client._id,
            change: 'add',
          },
        ],
      }
    );
  });

  it('Should update the Subscription Tier step', async () => {
    let subscriptionTier = await Stories.actions.hosts.updateOnboardingProcessStep<IOnboardingSubscriptionConfiguration>(
      host,
      HostOnboardingStep.SubscriptionConfiguration,
      {
        tier: HostSubscriptionLevel.Enterprise,
      }
    );
  });

  it('Host should fill out every section of the onboarding process', async () => {});

  it('Should delete a user', async () => {});
});

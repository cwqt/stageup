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
  IHostOnboarding,
  IOnboardingAddMembers,
  IOnboardingOwnerDetails,
  IOnboardingProofOfBusiness,
  IOnboardingSocialPresence,
  IOnboardingStepMap,
  IOnboardingSubscriptionConfiguration,
  IPerson,
  IUser,
  PersonTitle,
} from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { expect } from 'chai';

describe('As Client, I want to register a Host & be onboarded', async () => {
  let client: IUser;
  let admin: IUser;
  let host: IHost;
  let onboarding: IHostOnboarding;
  let steps: IOnboardingStepMap;

  it('Should create an admin user & a client user', async () => {
    await Stories.actions.common.setup();
    admin = Stories.cachedUsers[UserType.SiteAdmin]!.user;
    client = await Stories.actions.users.createUser(UserType.Client);
    await Stories.actions.common.switchActor(UserType.Client);
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
    expect(onboarding.last_modified_by._id).to.eq(client._id);
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

  it('Should get the created onboarding processes steps', async () => {
    let step0 = await Stories.actions.hosts.readOnboardingProcessStep<IOnboardingProofOfBusiness>(
      host,
      HostOnboardingStep.ProofOfBusiness
    );
    let step1 = await Stories.actions.hosts.readOnboardingProcessStep<IOnboardingOwnerDetails>(
      host,
      HostOnboardingStep.OwnerDetails
    );
    let step2 = await Stories.actions.hosts.readOnboardingProcessStep<IOnboardingSocialPresence>(
      host,
      HostOnboardingStep.SocialPresence
    );
    let step3 = await Stories.actions.hosts.readOnboardingProcessStep<IOnboardingAddMembers>(
      host,
      HostOnboardingStep.AddMembers
    );
    let step4 = await Stories.actions.hosts.readOnboardingProcessStep<IOnboardingSubscriptionConfiguration>(
      host,
      HostOnboardingStep.SubscriptionConfiguration
    );

    // Make a
    steps = {
      [HostOnboardingStep.ProofOfBusiness]: step0,
      [HostOnboardingStep.OwnerDetails]: step1,
      [HostOnboardingStep.SocialPresence]: step2,
      [HostOnboardingStep.AddMembers]: step3,
      [HostOnboardingStep.SubscriptionConfiguration]: step4,
    };
  });

  it('Should submit the onboarding process for verification', async () => {
    await Stories.actions.hosts.submitOnboardingProcess(host);
  });

  describe('As a Site Admin, I want to verify some steps & submit issues with others', async () => {
    it('Should get the pending onboarding request in the admin panel', async () => {
      await Stories.actions.common.switchActor(UserType.SiteAdmin);
      let localOnboarding = await Stories.actions.admin.readOnboardingProcesses();
      expect(localOnboarding.data).to.be.lengthOf(1);
      expect(localOnboarding.data[0].last_modified_by._id).to.eq(client._id);
      expect(localOnboarding.data[0].last_submitted).to.not.eq(null);

      // Set global for other tests to access
      onboarding = localOnboarding.data[0];
    });

    it('Should allow the Site Admin to verify some steps as valid', async () => {
      // All but the 
      await Stories.actions.admin.reviewStep(onboarding, HostOnboardingStep.AddMembers, { });
      await Stories.actions.admin.reviewStep(onboarding, HostOnboardingStep.OwnerDetails, { });
      await Stories.actions.admin.reviewStep(onboarding, HostOnboardingStep.SocialPresence, { });
      await Stories.actions.admin.reviewStep(onboarding, HostOnboardingStep.SubscriptionConfiguration, { });
    });

    it('Should allow the Site Admin to create issues on an onboarding process', async () => {

    });
  });

  describe('As a Client, I want to resolve issues with my onboarding process & then re-submit for verification', async () => {});

  describe('As a Site Admin, I want to verify all steps and enact the onboarding process', async () => {});
});

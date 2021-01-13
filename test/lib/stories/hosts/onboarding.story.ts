// create user admin
// create user client
// create host
// complete steps of onboarding process
// submit onboarding
// verify onboarding
// done

import { describe, it } from 'mocha';
import {
  HostOnboardingState,
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
import { on } from 'process';

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
    expect(onboarding.state).to.equal(HostOnboardingState.AwaitingChanges);
    expect(onboarding.last_modified_by.username).to.equal(client.username);
    expect(onboarding.last_modified_by.name).to.equal(client.name);
    expect(onboarding.host.name).to.equal(host.name);
    expect(onboarding.host.username).to.equal(host.username);
    
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
      expect(step0.state).to.equal(HostOnboardingState.AwaitingChanges);
      expect(step0.data.hmrc_company_number).to.equal(11940210);
      expect(step0.data.business_address.city).to.equal('Cardiff');
      expect(step0.data.business_address.iso_country_code).to.equal('GBR');
      expect(step0.data.business_address.postcode).to.equal('NE62 5DE');
      expect(step0.data.business_address.street_name).to.equal('Marquee Court');
      expect(step0.data.business_address.street_number).to.equal(32);
      expect(step0.data.business_contact_number).to.equal('+447625143141');

    let step1 = await Stories.actions.hosts.readOnboardingProcessStep<IOnboardingOwnerDetails>(
      host,
      HostOnboardingStep.OwnerDetails
    );
    expect(step1.state).to.equal(HostOnboardingState.AwaitingChanges);
    expect(step1.data.owner_info.first_name).to.equal("Drake");
    expect(step1.data.owner_info.last_name).to.equal("Drakeford");
    expect(step1.data.owner_info.title).to.equal("mr");

    let step2 = await Stories.actions.hosts.readOnboardingProcessStep<IOnboardingSocialPresence>(
      host,
      HostOnboardingStep.SocialPresence
    );
    expect(step2.state).to.equal(HostOnboardingState.AwaitingChanges);
    expect(step2.data.social_info.facebook_url).to.equal("https://facebook.com/eventi");
    expect(step2.data.social_info.instagram_url).to.equal("https://instagram.com/eventi");
    expect(step2.data.social_info.linkedin_url).to.equal("https://linkedin.com/eventi");

    let step3 = await Stories.actions.hosts.readOnboardingProcessStep<IOnboardingAddMembers>(
      host,
      HostOnboardingStep.AddMembers
    );
    expect(step3.state).to.equal(HostOnboardingState.AwaitingChanges);
    expect(step3.data.members_to_add[0].change).to.equal("add");
    expect(step3.data.members_to_add[0].user_id).to.equal(client._id);   

    let step4 = await Stories.actions.hosts.readOnboardingProcessStep<IOnboardingSubscriptionConfiguration>(
      host,
      HostOnboardingStep.SubscriptionConfiguration
    );
    expect(step4.state).to.equal(HostOnboardingState.AwaitingChanges);
    expect(step4.data.tier).to.equal(HostSubscriptionLevel.Enterprise);

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
      // All but the Proof Of Business to be verified
      await Stories.actions.admin.reviewStep(onboarding, HostOnboardingStep.AddMembers, {
        step_state: HostOnboardingState.Verified,
        issues: [],
      });
      await Stories.actions.admin.reviewStep(onboarding, HostOnboardingStep.OwnerDetails, {
        step_state: HostOnboardingState.Verified,
        issues: [],
      });
      await Stories.actions.admin.reviewStep(onboarding, HostOnboardingStep.SocialPresence, {
        step_state: HostOnboardingState.Verified,
        issues: [],
      });
      await Stories.actions.admin.reviewStep(onboarding, HostOnboardingStep.SubscriptionConfiguration, {
        step_state: HostOnboardingState.Verified,
        issues: [],
      });
    });

    it('Should allow the Site Admin to create issues on an onboarding process & then submit', async () => {
      await Stories.actions.admin.reviewStep<IOnboardingProofOfBusiness>(
        onboarding,
        HostOnboardingStep.ProofOfBusiness,
        {
          step_state: HostOnboardingState.HasIssues,
          issues: [
            {
              param: 'hmrc_company_number',
              message: "Couldn't find this company number in the registry",
            },
            {
              param: 'business_address',
              //TODO: make this better with nested issues
              message: 'The street address & street number is invalid',
            },
          ],
        }
      );

      await Stories.actions.admin.submitOnboardingProcess(onboarding);
    });
  });

  describe('As a Client, I want to resolve issues with my onboarding process & then re-submit for verification', async () => {
    it('Should get the step that had issues attached to it by the Site Admin', async () => {
      await Stories.actions.common.switchActor(UserType.Client);
      const step = await Stories.actions.hosts.readOnboardingProcessStep(host, HostOnboardingStep.ProofOfBusiness);

      expect(step.state).to.eq(HostOnboardingState.HasIssues);
      expect(step.review?.issues).to.be.lengthOf(2);
      expect(step.review?.reviewed_by.username).to.eq(Stories.cachedUsers[UserType.SiteAdmin]?.user.username);
    });

    it('Should update the the step with issues & re-submit for verification', async () => {
      await Stories.actions.hosts.updateOnboardingProcessStep(host, HostOnboardingStep.ProofOfBusiness, {
        business_address: {
          city: 'Cardiff',
          iso_country_code: 'GBR',
          postcode: 'NE62 5DE',
          street_name: 'Marquee Court',
          street_number: 32,
        },
        business_contact_number: '+447625143141',
        hmrc_company_number: 11940213,
      });

      await Stories.actions.hosts.submitOnboardingProcess(host);
    });
  });

  describe('As a Site Admin, I want to verify the last step, and then enact the onboarding', async () => {
    it('Should review the step, and then submit the onboarding request review', async () => {
      await Stories.actions.common.switchActor(UserType.SiteAdmin);
      await Stories.actions.admin.reviewStep(onboarding, HostOnboardingStep.ProofOfBusiness, {
        step_state: HostOnboardingState.Verified,
        issues: [],
      });

      await Stories.actions.admin.submitOnboardingProcess(onboarding);
      
      
    });
  });
});
// create user admin
// create user client
// create host
// complete steps of onboarding process
// submit onboarding
// verify onboarding
// done

import {
  BusinessType,
  CountryCode,
  HostOnboardingState,
  HostOnboardingStep,
  IHost,
  IHostBusinessDetails,
  IHostOnboarding,
  IOnboardingStep,
  IOnboardingStepMap,
  IPersonInfo,
  ISocialInfo,
  IUser,
  PersonTitle
} from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';

describe('As Client, I want to register a Host & be onboarded', () => {
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
      email_address: 'host+test@stageup.uk'
    });

    expect(host).not.toBeNull();
  });

  it('Should get the created onboarding process', async () => {
    onboarding = await Stories.actions.hosts.readOnboardingProcessStatus(host);

    expect(onboarding.state).toBe(HostOnboardingState.AwaitingChanges);
    expect(onboarding.last_modified_by.username).toBe(client.username);
    expect(onboarding.last_modified_by.name).toBe(client.name);
    expect(onboarding.host.name).toBe(host.name);
    expect(onboarding.host.username).toBe(host.username);
  });

  it('Should update the Proof Of Business section', async () => {
    let proofOfBusiness: IOnboardingStep<IHostBusinessDetails> = await Stories.actions.hosts.updateOnboardingProcessStep<IHostBusinessDetails>(
      host,
      HostOnboardingStep.ProofOfBusiness,
      {
        business_address: {
          city: 'Cardiff',
          country: CountryCode.GB,
          postal_code: 'NE62 5DE',
          line1: 'Marquee Court'
        },
        business_contact_number: '+44 323 223 4234',
        hmrc_company_number: 11940210,
        // TODO: fix this vat number validation
        // vat_number: '123456789',
        business_type: BusinessType.GovernmentEntity
      }
    );

    expect(proofOfBusiness.data.business_address.city).toBe('Cardiff');
    expect(proofOfBusiness.data.business_address.country).toBe(CountryCode.GB);
    // expect(proofOfBusiness.data.vat_number).toBe('123456789');
    expect(proofOfBusiness.data.business_type).toBe(BusinessType.GovernmentEntity);
  });

  it('Should update the Owner Details step', async () => {
    let ownerDetails: IOnboardingStep<IPersonInfo> = await Stories.actions.hosts.updateOnboardingProcessStep(
      host,
      HostOnboardingStep.OwnerDetails,
      {
        title: PersonTitle.Dr,
        first_name: 'Drake',
        last_name: 'Drakeford'
      }
    );
    expect(ownerDetails.data.first_name).toBe('Drake');
    expect(ownerDetails.data.last_name).toBe('Drakeford');
  });

  it('Should update the Social Presence step', async () => {
    let socialPresence: IOnboardingStep<ISocialInfo> = await Stories.actions.hosts.updateOnboardingProcessStep(
      host,
      HostOnboardingStep.SocialPresence,
      {
        site_url: 'https://linkedin.com/stageupuk',
        linkedin_url: 'https://linkedin.com/eventi',
        facebook_url: 'https://facebook.com/eventi',
        instagram_url: 'https://instagram.com/eventi'
      }
    );
    expect(socialPresence.data.site_url).toBe('https://linkedin.com/stageupuk');
  });

  it('Should submit the onboarding process for verification', async () => {
    await Stories.actions.hosts.submitOnboardingProcess(host);
  });

  describe('As a Site Admin, I want to verify some steps & submit issues with others', () => {
    it('Should get the pending onboarding request in the admin panel', async () => {
      await Stories.actions.common.switchActor(UserType.SiteAdmin);
      let localOnboarding = await Stories.actions.admin.readOnboardingProcesses();
      expect(localOnboarding.data).toHaveLength(1);
      expect(localOnboarding.data[0].last_modified_by._id).toBe(client._id);
      expect(localOnboarding.data[0].last_submitted).not.toBe(null);

      // Set global for other tests to access
      onboarding = localOnboarding.data[0];
    });

    it('Should allow the Site Admin to verify some steps as valid', async () => {
      // All but the Proof Of Business to be verified
      await Stories.actions.admin.reviewOnboardingProcess(host, {
        [HostOnboardingStep.OwnerDetails]: {
          state: HostOnboardingState.Verified,
          issues: {}
        },
        [HostOnboardingStep.SocialPresence]: {
          state: HostOnboardingState.Verified,
          issues: {}
        },
        // Submit an issue here
        [HostOnboardingStep.ProofOfBusiness]: {
          state: HostOnboardingState.HasIssues,
          issues: {
            ['hmrc_company_number']: ["Couldn't find this company number in the registry", 'This is another issue'],
            ['business_address.street_name']: ['The street address could not be found'],
            ['business_address.street_number']: ['The street number could not be found'],
            ['business_address']: ['Incorrect details provided']
          }
        }
      });
    });

    it('Should get the onboarding process in full', async () => {
      const status = await Stories.actions.hosts.readOnboardingSteps(host);
      expect(status[HostOnboardingStep.ProofOfBusiness].state).toEqual(HostOnboardingState.HasIssues);
    });
  });

  describe('As a Client, I want to resolve issues with my onboarding process & then re-submit for verification', () => {
    it('Should get the step that had issues attached to it by the Site Admin', async () => {
      await Stories.actions.common.switchActor(UserType.Client);
      const step = await Stories.actions.hosts.readOnboardingProcessStep(host, HostOnboardingStep.ProofOfBusiness);

      expect(step.state).toEqual(HostOnboardingState.HasIssues);
      expect(step.review.issues).toMatchObject({
        ['hmrc_company_number']: ["Couldn't find this company number in the registry", 'This is another issue'],
        ['business_address.street_name']: ['The street address could not be found'],
        ['business_address.street_number']: ['The street number could not be found'],
        ['business_address']: ['Incorrect details provided']
      });
    });

    it('Should update the the step with issues & re-submit for verification', async () => {
      await Stories.actions.hosts.updateOnboardingProcessStep(host, HostOnboardingStep.ProofOfBusiness, {
        business_address: {
          city: 'Cardiff',
          country: 'GB',
          postal_code: 'NE62 5DE',
          line1: '32 Marquee Court'
        },
        business_contact_number: '+44 323 223 4234',
        hmrc_company_number: 11940213,
        business_type: BusinessType.GovernmentEntity
      });

      await Stories.actions.hosts.submitOnboardingProcess(host);
    });
  });

  describe('As a Site Admin, I want to verify the last step, and then enact the onboarding', () => {
    it('Should review the step, and then submit the onboarding request review', async () => {
      await Stories.actions.common.switchActor(UserType.SiteAdmin);
      await Stories.actions.admin.reviewOnboardingProcess(host, {
        [HostOnboardingStep.ProofOfBusiness]: {
          state: HostOnboardingState.Verified,
          issues: {}
        }
      });
    });
  });
});

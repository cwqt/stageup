import { BusinessType, CountryCode, HostOnboardingState, HostOnboardingStep, IHost, IHostBusinessDetails, PersonTitle } from "@core/interfaces";
import { Stories } from "../../stories";

describe('Test all the admin controller methods', () => {
  let host: IHost;

  beforeAll(async () => {
    await Stories.actions.common.setup();

    // Submit and onboarding process
    host = await Stories.actions.hosts.createHost({
      username: 'hostname',
      name: 'host name',
      email_address: 'host@email.com'
    });

    await Stories.actions.hosts.updateOnboardingProcessStep<IHostBusinessDetails>(
      host,
      HostOnboardingStep.ProofOfBusiness,
      {
        business_address: {
          city: 'Cardiff',
          country: CountryCode.GB,
          postal_code: 'NE62 5DE',
          line1: '32 Marquee Court'
        },
        hmrc_company_number: 11940210,
        business_contact_number: '+44 323 223 4234',
        business_type: BusinessType.Company
      }
    );

    await Stories.actions.hosts.updateOnboardingProcessStep(
      host,
      HostOnboardingStep.OwnerDetails,
      {
        title: PersonTitle.Dr,
        first_name: 'Drake',
        last_name: 'Drakeford'
      }
    );

    await Stories.actions.hosts.updateOnboardingProcessStep(
      host,
      HostOnboardingStep.SocialPresence,
      {
        site_url: 'https://linkedin.com/stageupuk',
        linkedin_url: 'https://linkedin.com/eventi',
        facebook_url: 'https://facebook.com/eventi',
        instagram_url: 'https://instagram.com/eventi'
      }
    );

    await Stories.actions.hosts.submitOnboardingProcess(host);
  });

  it('Should read all the onboarding processes', async () => {
    const onboardingProcesses = await Stories.actions.admin.readOnboardingProcesses();
    expect(onboardingProcesses.data[0].host._id).toEqual(host._id);
    expect(onboardingProcesses.data[0].state).toEqual(HostOnboardingState.PendingVerification);
  });

  it('Should review an onboarding process', async () => {
    await Stories.actions.admin.reviewOnboardingProcess(host, {
      [HostOnboardingStep.OwnerDetails]: {
        state: HostOnboardingState.Verified,
        issues: {}
      },
      [HostOnboardingStep.SocialPresence]: {
        state: HostOnboardingState.Verified,
        issues: {}
      },
      [HostOnboardingStep.ProofOfBusiness]: {
        state: HostOnboardingState.Verified,
        issues: {}
      }
    });

    const onboardingProcesses = await Stories.actions.admin.readOnboardingProcesses();
    expect(onboardingProcesses.data[0].host._id).toEqual(host._id);
    expect(onboardingProcesses.data[0].state).toEqual(HostOnboardingState.Enacted);
  });
});

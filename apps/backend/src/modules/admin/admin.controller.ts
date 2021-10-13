import {
  EventBus,
  EVENT_BUS_PROVIDER,
  getCheck,
  IControllerEndpoint,
  ModuleController,
  Onboarding,
  OnboardingReview,
  transact,
  User,
  UserHostInfo
} from '@core/api';
import { IQueryParams } from '@core/helpers';
import {
  HostOnboardingState,
  HostOnboardingStep,
  HostPermission,
  IEnvelopedData,
  IHostOnboarding,
  IOnboardingReview
} from '@core/interfaces';
import { array, enums, object, optional, record, string } from 'superstruct';
import { Inject, Service } from 'typedi';
import AuthStrat from '../../common/authorisation';
import { AdminService } from './admin.service';

@Service()
export class AdminController extends ModuleController {
  constructor(private adminService: AdminService, @Inject(EVENT_BUS_PROVIDER) private bus: EventBus) {
    super();
  }

  readOnboardingProcesses: IControllerEndpoint<IEnvelopedData<IHostOnboarding[], null>> = {
    authorisation: AuthStrat.isSiteAdmin,
    controller: async req => {
      const envelope = await this.adminService.readOnboardingProcesses(req.query as IQueryParams);
      return {
        data: envelope.data.map(o => o.toFull()),
        __client_data: envelope.__client_data,
        __paging_data: envelope.__paging_data
      };
    }
  };

  /**
   * @description Reviews all data & Merge the Hosts Onboarding Process with the host if all steps valid,
   * otherwise submit e-mail requesting changes
   */
  reviewOnboardingProcess: IControllerEndpoint<void> = {
    authorisation: AuthStrat.isSiteAdmin,
    validators: {
      body: record(
        enums([HostOnboardingStep.OwnerDetails, HostOnboardingStep.ProofOfBusiness, HostOnboardingStep.SocialPresence]),
        object({
          state: enums([HostOnboardingState.HasIssues, HostOnboardingState.Verified]),
          review_message: optional(string()),
          issues: record(string(), array(string()))
        })
      )
    },
    controller: async req => {
      const submission: IOnboardingReview['steps'] = req.body;
      const reviewer = await getCheck(User.findOne({ _id: req.session.user._id }));
      const onboarding = await getCheck(
        Onboarding.findOne({ relations: { host: true }, where: { host: { _id: req.params.hid } } })
      );

      onboarding.version += 1;

      // Create new review & map the states onto the actual step data
      const review = new OnboardingReview(onboarding, reviewer, submission);
      Object.keys(submission).forEach(k => (onboarding.steps[k].state = submission[k].state));

      // If any step has issues, set the onboarding to has issues - otherwise all verified & awaiting enaction
      onboarding.state = Object.keys(onboarding.steps).some(
        step => onboarding.steps[step].state == HostOnboardingState.HasIssues
      )
        ? HostOnboardingState.HasIssues
        : HostOnboardingState.Verified;

      await transact(async txc => {
        await txc.save(review);
        onboarding.reviews.push(review);

        // Check if every step is set to valid, if not set state to HasIssues & return early
        if (Object.values(onboarding.steps).every(o => o.state !== HostOnboardingState.Verified)) {
          onboarding.state = HostOnboardingState.HasIssues;
          return await txc.save(onboarding);
        }

        // Steps are all valid, welcome the host onboard....
        const host = onboarding.host; // Eager loaded

        // Proof of Business
        const proofOfBusinessData = onboarding.steps[HostOnboardingStep.ProofOfBusiness].data;
        host.business_details = proofOfBusinessData;

        // Owner Details
        const ownerDetailsData = onboarding.steps[HostOnboardingStep.OwnerDetails].data;
        const owner = await UserHostInfo.findOne({
          relations: {
            user: {
              personal_details: true
            }
          },
          where: {
            permissions: HostPermission.Owner
          }
        });

        owner.user.personal_details.first_name = ownerDetailsData.first_name;
        owner.user.personal_details.last_name = ownerDetailsData.last_name;
        owner.user.personal_details.title = ownerDetailsData.title;
        await txc.save(owner.user.personal_details);

        // Social Info
        const socialInfoData = onboarding.steps[HostOnboardingStep.SocialPresence].data;
        host.social_info = socialInfoData;

        if (onboarding.state !== HostOnboardingState.HasIssues) {
          onboarding.state = HostOnboardingState.Enacted;
          host.is_onboarded = true;
        }        

        await Promise.all([txc.save(host), txc.save(onboarding)]);
      });

      console.log('at the end');
      console.log(onboarding.state);

      // Listeners should then send e-mails depending on the current state of the onboarding process
      await this.bus.publish('onboarding.reviewed', { onboarding_id: onboarding._id }, req.locale);
    }
  };
}

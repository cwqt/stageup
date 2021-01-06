import { ErrorHandler, getCheck } from '../common/errors';
import {
  HostOnboardingState,
  HostOnboardingStep,
  HTTP,
  IEnvelopedData,
  IHostOnboarding,
  IHostOnboardingProcess,
  IOnboardingStepReview,
  IOnboardingStepReviewSubmission,
} from '@eventi/interfaces';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../common/authorisation';
import { HostOnboardingProcess } from '../models/Hosts/Onboarding.model';
import { body, array } from '../common/validate';
import Validators from '../common/validate';
import { OnboardingStepReview } from '../models/Hosts/OnboardingStepReview.model';
import { User } from '../models/Users/User.model';
import logger from '../common/logger';

export default class AdminController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  readOnboardingProcesses(): IControllerEndpoint<IEnvelopedData<IHostOnboarding[], null>> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        const onboardingEnvelope = await this.ORM.createQueryBuilder(HostOnboardingProcess, 'hop').paginate();

        return {
          data: onboardingEnvelope.data.map(o => o.toFull()),
          __paging_data: onboardingEnvelope.__paging_data,
        };
      },
    };
  }
  
  reviewStep(): IControllerEndpoint<void> {
    return {
      validators: [
        body<IOnboardingStepReviewSubmission<any>>({
          step_state: v => v.isIn([HostOnboardingState.HasIssues, HostOnboardingState.Verified]),
          issues: v => v.isArray().custom(array(Validators.Objects.IOnboardingIssue())),
          review_message: v => v.optional(true).isString(),
        }),
      ],
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        const step: HostOnboardingStep = parseInt(req.params.step);
        const submission: IOnboardingStepReviewSubmission<any> = req.body;
        const reviewer = await getCheck(User.findOne({ _id: req.session.user._id }));
        const onboarding = await getCheck(HostOnboardingProcess.findOne({ _id: parseInt(req.params.oid) }));

        const review = new OnboardingStepReview(step, onboarding, reviewer, submission);

        await this.ORM.transaction(async txc => {
          await txc.save(review);
          
          onboarding.steps[step].state = review.step_state;
          if (Object.values(onboarding.steps).every(o => o.state == HostOnboardingState.Verified)) {
            onboarding.state = HostOnboardingState.Verified;
          } else {
            onboarding.state = HostOnboardingState.AwaitingChanges;
          }

          await txc.save(onboarding);
        });
      },
    };
  }

  /**
   * @description Merge the Hosts Onboarding Process with the host
   */
  submitOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        const onboarding = await getCheck(HostOnboardingProcess.findOne({ _id: parseInt(req.params.oid) }));

        if (Object.values(onboarding.steps).every(o => o.state == HostOnboardingState.Verified)) {
          // enact the onboarding
          logger.info("All steps valid & signed off!")
        } else {
          logger.info("Not all steps are signed off as valid")
        }
      },
    };
  }
}

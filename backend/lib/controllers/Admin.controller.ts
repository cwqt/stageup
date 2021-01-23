import logger from '../common/logger';
import config, { Environment } from '../config';
import Validators, { body, array, query } from '../common/validate';
import { getCheck } from '../common/errors';
import {
  HostOnboardingState,
  HostOnboardingStep,
  HostPermission,
  IEnvelopedData,
  IHostOnboarding,
  IOnboardingStepReviewSubmission
} from '@eventi/interfaces';
import { BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../common/authorisation';
import { HostOnboardingProcess } from '../models/hosts/onboarding.model';

import { OnboardingStepReview } from '../models/hosts/onboarding-step-review.model';
import { User } from '../models/users/user.model';
import { sendUserHostMembershipInvitation } from '../common/email';
import { UserHostInfo } from '../models/hosts/user-host-info.model';

export default class AdminController extends BaseController {
  readOnboardingProcesses(): IControllerEndpoint<IEnvelopedData<IHostOnboarding[], null>> {
    return {
      validators: [
        query<{
          username: string;
          submission_date_sort: string;
          state: HostOnboardingState;
        }>({
          username: v => v.optional(true).isString(),
          submission_date_sort: v => v.optional(true).isIn(['ASC', 'DESC']),
          state: v => v.optional(true).isIn(Object.values(HostOnboardingState))
        })
      ],
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        const qb = this.ORM.createQueryBuilder(HostOnboardingProcess, 'hop')
          .innerJoinAndSelect('hop.host', 'host') // Pull in host & filter by host
          .where('host.username LIKE :username', {
            username: req.body.username ? `%${req.body.username as string}%` : '%'
          });

        // Not sure about fuzzy matching ints, so don't make a WHERE if none passed
        if (req.query.state) {
          qb.andWhere('hop.state = :state', { state: req.query.state });
        }

        const onboardingEnvelope = await qb
          .orderBy('hop.last_submitted', (req.params.submission_date_sort as 'ASC' | 'DESC') ?? 'ASC')
          .paginate();

        return {
          data: onboardingEnvelope.data.map(o => o.toFull()),
          __paging_data: onboardingEnvelope.__paging_data
        };
      }
    };
  }

  reviewStep(): IControllerEndpoint<void> {
    return {
      validators: [
        body<IOnboardingStepReviewSubmission<any>>({
          step_state: v => v.isIn([HostOnboardingState.HasIssues, HostOnboardingState.Verified]),
          issues: v => v.isArray().custom(array(Validators.Objects.IOnboardingIssue())),
          review_message: v => v.optional(true).isString()
        })
      ],
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        const step: HostOnboardingStep = Number.parseInt(req.params.step);
        const submission: IOnboardingStepReviewSubmission<any> = req.body;
        const reviewer = await getCheck(User.findOne({ _id: req.session.user._id }));
        const onboarding = await getCheck(HostOnboardingProcess.findOne({ _id: Number.parseInt(req.params.oid) }));

        const review = new OnboardingStepReview(step, onboarding, reviewer, submission);

        await this.ORM.transaction(async txc => {
          await txc.save(review);

          onboarding.steps[step].state = review.step_state;
          onboarding.state = Object.values(onboarding.steps).every(o => o.state === HostOnboardingState.Verified)
            ? HostOnboardingState.Verified
            : HostOnboardingState.AwaitingChanges;

          await txc.save(onboarding);
        });
      }
    };
  }

  /**
   * @description Merge the Hosts Onboarding Process with the host
   */
  submitOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        const onboarding = await getCheck(HostOnboardingProcess.findOne({ _id: Number.parseInt(req.params.oid) }));

        // Every step is verified when submitted, so enact the onboarding process
        // by which I mean shift the data from Onboarding -> Host & send out invites for added members
        await this.ORM.transaction(async txc => {
          if (Object.values(onboarding.steps).every(o => o.state === HostOnboardingState.Verified)) {
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

            owner.user.personal_details.first_name = ownerDetailsData.owner_info.first_name;
            owner.user.personal_details.last_name = ownerDetailsData.owner_info.last_name;
            owner.user.personal_details.title = ownerDetailsData.owner_info.title;
            await txc.save(owner.user.personal_details);

            // Social Info
            const socialInfoData = onboarding.steps[HostOnboardingStep.SocialPresence].data;
            host.social_info = socialInfoData.social_info;

            // Add Members
            const addMemberData = onboarding.steps[HostOnboardingStep.AddMembers].data;
            // These are all just 'add' actions, so send an invitation & add them to the host
            await Promise.allSettled(
              addMemberData.members_to_add.map(async member => {
                try {
                  const potentialMember = await User.findOne({ _id: member.user_id });
                  // Don't add the owner if they're already in
                  if (potentialMember?._id !== owner.user._id) {
                    if (potentialMember) {
                      if (!config.isEnv(Environment.Production)) {
                        sendUserHostMembershipInvitation(potentialMember.email_address, host);
                      }

                      // Add the member as pending (updated on membership acceptance to Member)
                      await host.addMember(potentialMember, HostPermission.Pending, txc);
                    } else {
                      logger.error(
                        `Found no such user with _id: ${member.user_id} in onboarding request: ${onboarding._id}`
                      );
                    }
                  }
                } catch (error) {
                  logger.error(error);
                }
              })
            );

            // TODO: Subscription level

            // TODO: Once the onboarding process is complete, we no longer need it & it + it's onboarding issues
            // can be deleted
            host.is_onboarded = true;
            await txc.save(host);
            logger.info('All steps valid & signed off!');
          } else {
            logger.info('Not all steps are signed off as valid');
          }
        });
      }
    };
  }
}

import logger from '../common/logger';
import { body, query, single } from '../common/validate';
import { getCheck } from '../common/errors';
import {
  HostOnboardingState,
  HostOnboardingStep,
  HostPermission,
  IEnvelopedData,
  IHostOnboarding,
  IOnboardingReview
} from '@core/interfaces';
import { BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../common/authorisation';
import { Onboarding } from '../models/hosts/onboarding.model';

import { OnboardingReview } from '../models/hosts/onboarding-review.model';
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
        const qb = this.ORM.createQueryBuilder(Onboarding, 'hop')
          .innerJoinAndSelect('hop.host', 'host') // Pull in host & filter by host
          .where('host.username LIKE :username', {
            username: req.body.username ? `%${req.body.username as string}%` : '%'
          })

        // Not sure about fuzzy matching ints, so don't make a WHERE if none passed
        if (req.query.state) {
          qb.andWhere('hop.state = :state', { state: req.query.state });
        }

        return await qb
          .orderBy('hop.last_submitted', (req.params.submission_date_sort as 'ASC' | 'DESC') ?? 'ASC')
          .paginate(o => o.toFull());
      }
    };
  }

  reviewOnboardingProcess(): IControllerEndpoint<void> {
    return {
      validators: [
        body<IOnboardingReview['steps']>({
          '*': v =>
            v.custom(
              single({
                state: v => v.isIn([HostOnboardingState.HasIssues, HostOnboardingState.Verified]),
                review_message: v => v.optional(true).isString(),
                issues: v =>
                  v.custom(
                    single({
                      '*': v => v.isArray()
                    })
                  )
              })
            )
        })
      ],
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        // Controller does not actually submit to the host - that is done by enactOnboardingProcess
        const submission: IOnboardingReview['steps'] = req.body;
        const reviewer = await getCheck(User.findOne({ _id: req.session.user._id }));
        const onboarding = await getCheck(Onboarding.findOne({ _id: req.params.oid }));
        onboarding.version += 1;

        // Create new review & map the states onto the actual step data
        const review = new OnboardingReview(onboarding, reviewer, submission);
        Object.keys(submission)
          .map(k => Number.parseInt(k))
          .forEach(k => (onboarding.steps[k].state = submission[k].state));

        // If any step has issues, set the onboarding to has issues - otherwise all verified & awaiting enaction
        onboarding.state = Object.keys(onboarding.steps)
          .some(s => onboarding.steps[s as unknown as HostOnboardingStep].state == HostOnboardingState.HasIssues)
            ? HostOnboardingState.HasIssues
            : HostOnboardingState.Verified;

        await this.ORM.transaction(async txc => {
          await txc.save(review);
          onboarding.reviews.push(review);
          await txc.save(onboarding);
          // The admin will then enact to push requested changes (if any) to the Host
        });
      }
    };
  }

  /**
   * @description Merge the Hosts Onboarding Process with the host if all steps valid,
   * otherwise submit e-mail requesting changes
   */
  enactOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        // Every step is verified when submitted, so enact the onboarding process
        // by which I mean shift the data from Onboarding -> Host & send out invites for added members
        const onboarding = await getCheck(Onboarding.findOne({ _id: req.params.oid }));

        // Check if every step is set to valid, if not set state to HasIssues & request changes via email
        if (Object.values(onboarding.steps).every(o => o.state === HostOnboardingState.Verified)) {
          onboarding.state = HostOnboardingState.HasIssues;
          // TODO: Send an email requesting changes
          await onboarding.save();
          return;
        }

        // Steps are all valid, welcome the host onboard....
        await this.ORM.transaction(async txc => {
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
                const potentialMember = await User.findOne({ _id: member.value as string });
                if (!potentialMember)
                  logger.error(`Found no such user with _id: ${member.value} in onboarding request: ${onboarding._id}`);

                // Don't add the owner if they're already in
                if (potentialMember._id !== owner.user._id) {
                  sendUserHostMembershipInvitation(owner.user, potentialMember, host, txc);

                  // Add the member as pending (updated on membership acceptance to Member)
                  await host.addMember(potentialMember, HostPermission.Pending, txc);
                }
              } catch (error) {
                logger.error(error);
              }
            })
          );

          // TODO: Subscription level (needs requirements)

          // TODO: Once the onboarding process is complete, we no longer need it & it + it's onboarding issues
          // can be deleted
          onboarding.state = HostOnboardingState.Enacted;
          host.is_onboarded = true;
          await txc.save(host);
        });
      }
    };
  }
}

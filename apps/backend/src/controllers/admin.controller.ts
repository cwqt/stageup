import {
  HostOnboardingState,
  HostOnboardingStep,
  HostPermission,
  IEnvelopedData,
  IHostOnboarding,
  IOnboardingReview,
  IOnboardingStep
} from '@core/interfaces';
import {
  BaseController,
  IControllerEndpoint,
  getCheck,
  body,
  query,
  single,
  OnboardingReview,
  Onboarding,
  User,
  UserHostInfo
} from '@core/shared/api';
import { enumToValues } from '@core/shared/helpers';
import { BackendProviderMap } from '..';

import AuthStrat from '../common/authorisation';
import Email = require('../common/email');
import { log } from '../common/logger';

export default class AdminController extends BaseController<BackendProviderMap> {
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
          });

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
        const onboarding = await getCheck(
          Onboarding.findOne({ relations: { host: true }, where: { host: { _id: req.params.hid } } })
        );
        onboarding.version += 1;

        // Create new review & map the states onto the actual step data
        const review = new OnboardingReview(onboarding, reviewer, submission);
        Object.keys(submission)
          .map(k => Number.parseInt(k))
          .forEach(k => (onboarding.steps[k].state = submission[k].state));

        // If any step has issues, set the onboarding to has issues - otherwise all verified & awaiting enaction
        onboarding.state = Object.keys(onboarding.steps).some(
          s => onboarding.steps[(s as unknown) as HostOnboardingStep].state == HostOnboardingState.HasIssues
        )
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
        const onboarding = await getCheck(
          Onboarding.findOne({ relations: { host: true }, where: { host: { _id: req.params.hid } } })
        );

        // Check if every step is set to valid, if not set state to HasIssues & request changes via email
        if (Object.values(onboarding.steps).every(o => o.state !== HostOnboardingState.Verified)) {
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

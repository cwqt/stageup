import {
  ErrCode,
  HostOnboardingStep,
  HostPermission,
  IHost,
  IHostOnboarding,
  HostOnboardingState,
  IHostPrivate,
  IOnboardingAddMembers,
  IOnboardingOwnerDetails,
  IOnboardingProofOfBusiness,
  IOnboardingSocialPresence,
  IOnboardingStep,
  IOnboardingSubscriptionConfiguration,
  IUser,
  IUserHostInfo,
  pick,
  IUserStub,
  HTTP
} from '@eventi/interfaces';
import { Request } from 'express';
import { User } from '../models/Users/User.model';
import { Host } from '../models/hosts/host.model';
import { ErrorHandler, getCheck } from '../common/errors';

import { UserHostInfo } from '../models/hosts/user-host-info.model';
import { BaseController, BaseArguments, IControllerEndpoint } from '../common/controller';
import { HostOnboardingProcess } from '../models/hosts/onboarding.model';
import AuthStrat from '../common/authorisation';
import Validators, { body, params as parameters, query } from '../common/validate';

import { unixTimestamp } from '../common/helpers';
import { OnboardingStepReview } from '../models/hosts/onboarding-step-review.model';

export default class HostController extends BaseController {
  constructor(...arguments_: BaseArguments) {
    super(...arguments_);
  }

  createHost(): IControllerEndpoint<IHost> {
    return {
      validators: [
        body<{
          email_address: IHostPrivate['email_address'];
          username: IHost['username'];
          name: IHost['name'];
        }>({
          email_address: v => Validators.Fields.email(v),
          username: v => Validators.Fields.username(v),
          name: v => Validators.Fields.name(v)
        })
      ],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async (request: Request): Promise<IHost> => {
        const user = await User.findOne({ _id: request.session.user._id }, { relations: ['host'] });
        if (user.host) {
          throw new ErrorHandler(HTTP.Conflict, ErrCode.DUPLICATE);
        }

        const h = await Host.findOne({ username: request.body.username });
        if (h) {
          throw new ErrorHandler(HTTP.Conflict, ErrCode.IN_USE);
        }

        // Create host & add current user (creator) to it through transaction
        // & begin the onboarding process by running setup
        return this.ORM.transaction(async txc => {
          const host = await txc.save(
            new Host({
              username: request.body.username,
              name: request.body.name,
              email_address: request.body.email_address
            })
          );

          // Save before setup because onboarding process depends on PK existing
          await host.setup(user, txc);
          await host.addMember(user, HostPermission.Owner, txc);
          return (await txc.save(host)).toFull();
        });
      }
    };
  }

  readHost(): IControllerEndpoint<IHost> {
    return {
      validators: [],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async (request: Request): Promise<IHost> => {
        const host = await Host.findOne({ _id: Number.parseInt(request.params.hid) });
        return host.toFull();
      }
    };
  }

  readHostMembers(): IControllerEndpoint<IUserStub[]> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async request => {
        const host = await Host.findOne(
          { _id: Number.parseInt(request.params.hid) },
          {
            relations: {
              members_info: {
                user: true
              }
            }
          }
        );
        return host.members_info.map(uhi => uhi.user.toStub());
      }
    };
  }

  updateHost(): IControllerEndpoint<IHost> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (request: Request): Promise<IHost> => {
        return {} as IHost;
      }
    };
  }

  deleteHost(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (request: Request): Promise<void> => {
        const user = await User.findOne({ _id: request.session.user._id }, { relations: ['host'] });
        if (!user.host) {
          throw new ErrorHandler(HTTP.NotFound, ErrCode.NOT_MEMBER);
        }

        const userHostInfo = await UserHostInfo.findOne({
          relations: ['user', 'host'],
          where: {
            user: { _id: user._id },
            host: { _id: user.host._id }
          }
        });

        if (userHostInfo.permissions != HostPermission.Owner) {
          throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);
        }

        // TODO: transactionally remove performances, signing keys, host infos etc etc.
        await user.host.remove();
      }
    };
  }

  addUser(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (request: Request): Promise<void> => {}
    };
  }

  removeUser(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (request: Request): Promise<void> => {}
    };
  }

  alterMemberPermissions(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (request: Request): Promise<void> => {}
    };
  }

  updateOnboarding(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async (request: Request): Promise<void> => {}
    };
  }

  readUserHostInfo(): IControllerEndpoint<IUserHostInfo> {
    return {
      validators: [
        query<{ user: string }>({
          user: v => v.exists().toInt()
        })
      ],
      controller: async (request: Request): Promise<IUserHostInfo> => {
        const uhi = await UserHostInfo.findOne({
          relations: ['host', 'user'],
          where: {
            user: {
              _id: Number.parseInt(request.query.user as string)
            },
            host: {
              _id: Number.parseInt(request.params.hid)
            }
          }
        });

        return uhi;
      },
      authStrategy: AuthStrat.none
    };
  }

  readOnboardingProcessStatus(): IControllerEndpoint<IHostOnboarding> {
    return {
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async request => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: Number.parseInt(request.params.hid)
            }
          },
          relations: ['host']
        });

        if (!onboarding) {
          throw new ErrorHandler(HTTP.NotFound);
        }

        return onboarding.toFull();
      }
    };
  }

  readOnboardingProcessStep(): IControllerEndpoint<IOnboardingStep<any>> {
    return {
      validators: [
        parameters<{ step: number }>({
          step: v => v.exists().toInt().isIn(Object.values(HostOnboardingStep))
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async (request: Request): Promise<IOnboardingStep<any>> => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: Number.parseInt(request.params.hid)
            }
          }
        });

        if (!onboarding) {
          throw new ErrorHandler(HTTP.NotFound);
        }

        const step = (request.params.step as unknown) as HostOnboardingStep;
        const stepReview = await OnboardingStepReview.findOne({
          where: {
            onboarding_step: step,
            onboarding_version: onboarding.version
          },
          relations: ['reviewed_by']
        });

        return { ...onboarding.steps[step], review: stepReview?.toFull() || null };
      }
    };
  }

  updateOnboardingProcessStep(): IControllerEndpoint<IOnboardingStep<any>> {
    return {
      validators: [
        parameters<{ step: number }>({
          step: v => v.exists().toInt().isIn(Object.values(HostOnboardingStep))
        })
      ],
      authStrategy: AuthStrat.isLoggedIn, // AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async (request: Request): Promise<IOnboardingStep<any>> => {
        if (!request.body) {
          throw new ErrorHandler(HTTP.DataInvalid, ErrCode.NO_DATA);
        }

        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: Number.parseInt(request.params.hid)
            }
          }
        });
        if (!onboarding) {
          throw new ErrorHandler(HTTP.NotFound);
        }

        const user = await getCheck(User.findOne({ _id: request.session.user._id }));

        // Pick updateable fields from interface type
        const u: { [index in HostOnboardingStep]: Function } = {
          [HostOnboardingStep.ProofOfBusiness]: (d: IOnboardingProofOfBusiness) =>
            pick(d, ['business_address', 'business_contact_number', 'hmrc_company_number']),
          [HostOnboardingStep.OwnerDetails]: (d: IOnboardingOwnerDetails) => pick(d, ['owner_info']),
          [HostOnboardingStep.SocialPresence]: (d: IOnboardingSocialPresence) => pick(d, ['social_info']),
          [HostOnboardingStep.AddMembers]: (d: IOnboardingAddMembers) => pick(d, ['members_to_add']),
          [HostOnboardingStep.SubscriptionConfiguration]: (d: IOnboardingSubscriptionConfiguration) => pick(d, ['tier'])
        };

        const step: HostOnboardingStep = Number.parseInt(request.params.step);

        try {
          await onboarding.updateStep(step, u[step](request.body));
        } catch (error) {
          console.log(error);
          throw new ErrorHandler(HTTP.DataInvalid, null, error);
        }

        await onboarding.setLastUpdated(user);
        await onboarding.save();
        return onboarding.steps[step];
      }
    };
  }

  submitOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isLoggedIn, // AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async (request: Request): Promise<void> => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: Number.parseInt(request.params.hid)
            }
          }
        });
        if (!onboarding) {
          throw new ErrorHandler(HTTP.NotFound);
        }

        if (onboarding.state != HostOnboardingState.AwaitingChanges) {
          throw new ErrorHandler(HTTP.BadRequest, ErrCode.LOCKED);
        }

        // TODO: verify all steps filled out
        // TODO: delete all previous version step reviews
        onboarding.last_submitted = unixTimestamp();
        onboarding.state = HostOnboardingState.PendingVerification;
        onboarding.version += 1;
        await onboarding.save();
      }
    };
  }
}

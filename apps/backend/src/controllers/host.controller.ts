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
  IUserHostInfo,
  pick,
  IUserStub,
  HTTP,
  IHostMemberChangeRequest,
  IOnboardingStepMap
} from '@eventi/interfaces';
import { User } from '../models/users/user.model';
import { Host } from '../models/hosts/host.model';
import { ErrorHandler, getCheck } from '../common/errors';

import { UserHostInfo } from '../models/hosts/user-host-info.model';
import { BaseController, IControllerEndpoint } from '../common/controller';
import { Onboarding } from '../models/hosts/onboarding.model';
import AuthStrat from '../common/authorisation';
import Validators, { body, params as parameters, query } from '../common/validate';
import { timestamp } from '../common/helpers';
import { OnboardingReview } from '../models/hosts/onboarding-review.model';

import logger from '../common/logger';
import Email = require('../common/email');

export default class HostController extends BaseController {
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
      controller: async req => {
        // Check if user is already part of a host - which they shouldn't
        const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
        if (user.host) throw new ErrorHandler(HTTP.Conflict, ErrCode.DUPLICATE);

        // Check if the username for a host is already taken
        const h = await Host.findOne({ username: req.body.username });
        if (h) throw new ErrorHandler(HTTP.Conflict, ErrCode.IN_USE);

        // Create host & add current user (creator) to it through transaction
        // & begin the onboarding process by running setup
        return this.ORM.transaction(async txc => {
          const host = await txc.save(
            new Host({
              username: req.body.username,
              name: req.body.name,
              email_address: req.body.email_address
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
      controller: async req => {
        const host = await Host.findOne({ _id: Number.parseInt(req.params.hid) });
        return host.toFull();
      }
    };
  }

  readMembers(): IControllerEndpoint<IUserStub[]> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const host = await Host.findOne(
          { _id: Number.parseInt(req.params.hid) },
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

  // updateHost(): IControllerEndpoint<IHost> {
  //   return {
  //     validators: [],
  //     authStrategy: AuthStrat.none,
  //     controller: async req => {
  //       return ({} as IHost);
  //     }
  //   };
  // }

  deleteHost(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
        if (!user.host) throw new ErrorHandler(HTTP.NotFound, ErrCode.NOT_MEMBER);

        const userHostInfo = await UserHostInfo.findOne({
          relations: ['user', 'host'],
          where: {
            user: { _id: user._id },
            host: { _id: user.host._id }
          }
        });

        if (userHostInfo.permissions !== HostPermission.Owner)
          throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);

        // TODO: transactionally remove performances, signing keys, host infos etc etc.
        await user.host.remove();
      }
    };
  }

  //router.post<IHost>("/hosts/:hid/members", Hosts.addMember());
  addMember(): IControllerEndpoint<IHost> {
    return {
      validators: [body<IHostMemberChangeRequest>(Validators.Objects.IHostMemberChangeRequest())],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async (req): Promise<IHost> => {
        const changeRequest: IHostMemberChangeRequest = req.body;
        // Check user not already part of a host in any capacity
        const user = await getCheck(User.findOne({ _id: changeRequest.value }, { relations: ['host'] }));
        if (user.host) throw new ErrorHandler(HTTP.Conflict, ErrCode.DUPLICATE);

        // Get host & pull in members_info for new member push
        const host = await getCheck(Host.findOne({ _id: parseInt(req.params.hid) }, { relations: ['members_info'] }));

        await this.ORM.transaction(async txc => {
          await host.addMember(user, HostPermission.Member, txc);
          await txc.save(host);
          await Email.sendUserHostMembershipInvitation(user.email_address, host);
        });

        return host.toFull();
      }
    };
  }

  // router.put <IHost>("/hosts/:hid/members/:mid",Hosts.updateMember());
  updateMember(): IControllerEndpoint<void> {
    return {
      validators: [body<IHostMemberChangeRequest>(Validators.Objects.IHostMemberChangeRequest())],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const userHostInfo = await getCheck(
          UserHostInfo.findOne({
            relations: ['user', 'host'],
            where: {
              user: { _id: parseInt(req.params.mid) },
              host: { _id: parseInt(req.params.hid) }
            }
          })
        );

        const newUserPermission: HostPermission = req.body.value;
        if (userHostInfo.permissions == HostPermission.Owner)
          throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);

        userHostInfo.permissions = newUserPermission;
        await userHostInfo.save();
      }
    };
  }

  // router.delete <void>("/hosts/:hid/members/:mid", Hosts.removeMember());
  removeMember(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const userHostInfo = await getCheck(
          UserHostInfo.findOne({
            relations: ['user', 'host'],
            where: {
              user: { _id: parseInt(req.params.mid) },
              host: { _id: parseInt(req.params.hid) }
            }
          })
        );

        if (userHostInfo.permissions == HostPermission.Owner)
          throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);
        await userHostInfo.remove();
      }
    };
  }

  readUserHostInfo(): IControllerEndpoint<IUserHostInfo> {
    return {
      validators: [
        query<{ user: string }>({
          user: v => v.exists().toInt()
        })
      ],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        const uhi = await UserHostInfo.findOne({
          relations: ['host', 'user'],
          where: {
            user: {
              _id: Number.parseInt(req.query.user as string)
            },
            host: {
              _id: Number.parseInt(req.params.hid)
            }
          }
        });

        return uhi;
      }
    };
  }

  readOnboardingProcessStatus(): IControllerEndpoint<IHostOnboarding> {
    return {
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async req => {
        const onboarding = await Onboarding.findOne({
          where: {
            host: {
              _id: Number.parseInt(req.params.hid)
            }
          },
          relations: ['host', "reviews"]
        });

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
      controller: async req => {
        const step = (req.params.step as unknown) as HostOnboardingStep;
        const onboarding = await getCheck(
          Onboarding.findOne({
            where: {
              host: {
                _id: Number.parseInt(req.params.hid)
              }
            }
          })
        );

        const review = await OnboardingReview.findOne({
          relations: ['onboarding', 'reviewed_by'],
          where: {
            onboarding_version: onboarding.version,
            onboarding: {
              _id: onboarding._id
            }
          }
        });

        return {
          state: onboarding.steps[step].state,
          valid: onboarding.steps[step].valid,
          data: onboarding.steps[step].data,
          review: review && review.steps[step]
        };
      }
    };
  }

  readOnboardingSteps(): IControllerEndpoint<IOnboardingStepMap> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        const onboarding = await getCheck(
          Onboarding.findOne({
            where: {
              host: {
                _id: parseInt(req.params.hid)
              }
            }
          })
        );

        const review = await OnboardingReview.findOne({
          relations: ['reviewed_by', 'onboarding'],
          where: {
            onboarding_version: onboarding.version,
            onboarding: {
              _id: onboarding._id
            }
          }
        });

        return Object.entries(onboarding.steps).reduce((acc, curr: [string, IOnboardingStep<any>]) => {
          const [step, data] = curr;
          acc[step] = {
            state: data.state,
            valid: data.valid,
            data: data.data,
            review: review && review[step]
          };

          return acc;
        }, {} as IOnboardingStepMap);
      }
    };
  }

  updateOnboardingProcessStep(): IControllerEndpoint<IOnboardingStep<unknown>> {
    return {
      validators: [
        parameters<{ step: number }>({
          step: v => v.exists().toInt().isIn(Object.values(HostOnboardingStep))
        })
      ],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        if (!req.body) throw new ErrorHandler(HTTP.DataInvalid, ErrCode.NO_DATA);
        const onboarding = await getCheck(
          Onboarding.findOne({
            where: {
              host: {
                _id: Number.parseInt(req.params.hid)
              }
            }
          })
        );

        const user = await getCheck(User.findOne({ _id: req.session.user._id }));

        // Pick updateable fields from interface type
        const u: { [index in HostOnboardingStep]: Function } = {
          [HostOnboardingStep.ProofOfBusiness]: (d: IOnboardingProofOfBusiness) =>
            pick(d, ['business_address', 'business_contact_number', 'hmrc_company_number']),
          [HostOnboardingStep.OwnerDetails]: (d: IOnboardingOwnerDetails) => pick(d, ['owner_info']),
          [HostOnboardingStep.SocialPresence]: (d: IOnboardingSocialPresence) => pick(d, ['social_info']),
          [HostOnboardingStep.AddMembers]: (d: IOnboardingAddMembers) => pick(d, ['members_to_add']),
          [HostOnboardingStep.SubscriptionConfiguration]: (d: IOnboardingSubscriptionConfiguration) => pick(d, ['tier'])
        };

        const step: HostOnboardingStep = Number.parseInt(req.params.step);

        try {
          await onboarding.updateStep(step, u[step](req.body));
        } catch (error) {
          logger.error(error);
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
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const onboarding = await getCheck(
          Onboarding.findOne({
            where: {
              host: {
                _id: Number.parseInt(req.params.hid)
              }
            }
          })
        );

        if (![HostOnboardingState.AwaitingChanges, HostOnboardingState.HasIssues].includes(onboarding.state))
          throw new ErrorHandler(HTTP.BadRequest, ErrCode.LOCKED);

        // TODO: verify all steps filled out
        // TODO: delete all previous version step reviews
        onboarding.last_submitted = timestamp();
        onboarding.state = HostOnboardingState.PendingVerification;
        onboarding.version += 1;
        await onboarding.save();
      }
    };
  }
}

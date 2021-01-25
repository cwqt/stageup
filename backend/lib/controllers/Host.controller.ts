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
  IOnboardingStepMap,
} from '@eventi/interfaces';
import { Request } from 'express';
import { User } from '../models/Users/User.model';
import { Host } from '../models/Hosts/Host.model';
import { ErrorHandler, getCheck } from '../common/errors';
import { HTTP } from '@eventi/interfaces';
import { UserHostInfo } from '../models/Hosts/UserHostInfo.model';
import { BaseController, BaseArgs, IControllerEndpoint } from '../common/controller';
import { HostOnboardingProcess } from '../models/Hosts/Onboarding.model';
import AuthStrat from '../common/authorisation';
import { body, params, query } from '../common/validate';
import Validators from '../common/validate';
import { unixTimestamp } from '../common/helpers';
import { OnboardingStepReview } from '../models/Hosts/OnboardingStepReview.model';

export default class HostController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
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
          name: v => Validators.Fields.name(v),
        }),
      ],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async (req: Request): Promise<IHost> => {
        const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
        if (user.host) throw new ErrorHandler(HTTP.Conflict, ErrCode.DUPLICATE);

        const h = await Host.findOne({ username: req.body.username });
        if (h) throw new ErrorHandler(HTTP.Conflict, ErrCode.IN_USE);

        // Create host & add current user (creator) to it through transaction
        // & begin the onboarding process by running setup
        return await this.ORM.transaction(async txc => {
          const host = await txc.save(
            new Host({
              username: req.body.username,
              name: req.body.name,
              email_address: req.body.email_address,
            })
          );

          // save before setup because onboarding process depends on PK existing
          await host.setup(user, txc);
          await host.addMember(user, HostPermission.Owner, txc);
          return (await txc.save(host)).toFull();
        });
      },
    };
  }

  readHost(): IControllerEndpoint<IHost> {
    return {
      validators: [],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async (req: Request): Promise<IHost> => {
        const host = await Host.findOne({ _id: parseInt(req.params.hid) });
        return host.toFull();
      },
    };
  }

  readHostMembers(): IControllerEndpoint<IUserStub[]> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const host = await Host.findOne(
          { _id: parseInt(req.params.hid) },
          {
            relations: {
              members_info: {
                user: true,
              },
            },
          }
        );
        return host.members_info.map(uhi => uhi.user.toStub());
      },
    };
  }

  updateHost(): IControllerEndpoint<IHost> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IHost> => {
        return {} as IHost;
      },
    };
  }

  deleteHost(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {
        const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
        if (!user.host) throw new ErrorHandler(HTTP.NotFound, ErrCode.NOT_MEMBER);

        const userHostInfo = await UserHostInfo.findOne({
          relations: ['user', 'host'],
          where: {
            user: { _id: user._id },
            host: { _id: user.host._id },
          },
        });

        if (userHostInfo.permissions != HostPermission.Owner)
          throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);

        // TODO: transactionally remove performances, signing keys, host infos etc etc.
        await user.host.remove();
      },
    };
  }

  addUser(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {},
    };
  }

  removeUser(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {},
    };
  }

  alterMemberPermissions(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {},
    };
  }

  updateOnboarding(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async (req: Request): Promise<void> => {},
    };
  }

  readUserHostInfo(): IControllerEndpoint<IUserHostInfo> {
    return {
      validators: [
        query<{ user: string }>({
          user: v => v.exists().toInt(),
        }),
      ],
      controller: async (req: Request): Promise<IUserHostInfo> => {
        const uhi = await UserHostInfo.findOne({
          relations: ['host', 'user'],
          where: {
            user: {
              _id: parseInt(req.query.user as string),
            },
            host: {
              _id: parseInt(req.params.hid),
            },
          },
        });

        return uhi;
      },
      authStrategy: AuthStrat.none,
    };
  }

  readOnboardingProcessStatus(): IControllerEndpoint<IHostOnboarding> {
    return {
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async req => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: parseInt(req.params.hid),
            },
          },
          relations: ['host'],
        });

        if (!onboarding) throw new ErrorHandler(HTTP.NotFound);
        return onboarding.toFull();
      },
    };
  }

  readOnboardingProcessStep(): IControllerEndpoint<IOnboardingStep<any>> {
    return {
      validators: [
        params<{ step: number }>({
          step: v => v.exists().toInt().isIn(Object.values(HostOnboardingStep)),
        }),
      ],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IOnboardingStep<any>> => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: parseInt(req.params.hid),
            },
          },
        });

        if (!onboarding) throw new ErrorHandler(HTTP.NotFound);

        const step = (req.params.step as unknown) as HostOnboardingStep;
        const stepReview = await OnboardingStepReview.findOne({
          where: {
            onboarding_step: step,
            onboarding_version: onboarding.version,
          },
          relations: ['reviewed_by'],
        });

        return { ...onboarding.steps[step], review: stepReview?.toFull() || null };
      },
    };
  }

  // router.get <IOnboardingStepMap>       ("/hosts/:hid/onboarding/steps",              Hosts.readOnboardingSteps()); 
  readOnboardingSteps(): IControllerEndpoint<IOnboardingStepMap> {
    return {
      
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IOnboardingStepMap> => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: parseInt(req.params.hid),
            }
          },
          
        });

        if (!onboarding) throw new ErrorHandler(HTTP.NotFound);

        let stepMap: IOnboardingStepMap;
        
        let stepReviews = [];

        for (let step = 0; step < 5 ; step++) {
          const stepReview = await OnboardingStepReview.findOne({
            where: {
              onboarding_step: step,
              onboarding_version: onboarding.version,
            },
            relations: ['reviewed_by'],
          }); 
          console.log(stepReview);
          stepReviews.push(stepReview);
        }

        // let stepReviews = await Promise.all(Object.values(HostOnboardingStep).map((step: HostOnboardingStep) => OnboardingStepReview.findOne({
        //   where: {
        //     onboarding_step: step,
        //   }
        // }) ))
      
        console.log(stepReviews);
        stepMap[HostOnboardingStep.ProofOfBusiness] = {...onboarding.steps[HostOnboardingStep.ProofOfBusiness], review: stepReviews[0]?.toFull() || null }
        stepMap[HostOnboardingStep.OwnerDetails] = {...onboarding.steps[HostOnboardingStep.OwnerDetails], review: stepReviews[1]?.toFull() || null }
        stepMap[HostOnboardingStep.SocialPresence] = {...onboarding.steps[HostOnboardingStep.SocialPresence], review: stepReviews[2]?.toFull() || null }
        stepMap[HostOnboardingStep.AddMembers] = {...onboarding.steps[HostOnboardingStep.AddMembers], review: stepReviews[3]?.toFull() || null }
        stepMap[HostOnboardingStep.SubscriptionConfiguration] = {...onboarding.steps[HostOnboardingStep.SubscriptionConfiguration], review: stepReviews[4]?.toFull() || null }

        return  stepMap;
      }
    }
  }

  getStepReviewForStep(step: HostOnboardingStep){
    
  }

  updateOnboardingProcessStep(): IControllerEndpoint<IOnboardingStep<any>> {
    return {
      validators: [
        params<{ step: number }>({
          step: v => v.exists().toInt().isIn(Object.values(HostOnboardingStep)),
        }),
      ],
      authStrategy: AuthStrat.isLoggedIn, //AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async (req: Request): Promise<IOnboardingStep<any>> => {
        if (!req.body) throw new ErrorHandler(HTTP.DataInvalid, ErrCode.NO_DATA);

        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: parseInt(req.params.hid),
            },
          },
        });
        if (!onboarding) throw new ErrorHandler(HTTP.NotFound);

        const user = await getCheck(User.findOne({ _id: req.session.user._id }));

        // pick updateable fields from interface type
        const u: { [index in HostOnboardingStep]: Function } = {
          [HostOnboardingStep.ProofOfBusiness]: (d: IOnboardingProofOfBusiness) =>
            pick(d, ['business_address', 'business_contact_number', 'hmrc_company_number']),
          [HostOnboardingStep.OwnerDetails]: (d: IOnboardingOwnerDetails) => pick(d, ['owner_info']),
          [HostOnboardingStep.SocialPresence]: (d: IOnboardingSocialPresence) => pick(d, ['social_info']),
          [HostOnboardingStep.AddMembers]: (d: IOnboardingAddMembers) => pick(d, ['members_to_add']),
          [HostOnboardingStep.SubscriptionConfiguration]: (d: IOnboardingSubscriptionConfiguration) =>
            pick(d, ['tier']),
        };

        const step: HostOnboardingStep = parseInt(req.params.step);

        try {
          await onboarding.updateStep(step, u[step](req.body));
        } catch (error) {
          console.log(error);
          throw new ErrorHandler(HTTP.DataInvalid, null, error);
        }

        await onboarding.setLastUpdated(user);
        await onboarding.save();
        return onboarding.steps[step];
      },
    };
  }

  submitOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isLoggedIn, //AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async (req: Request): Promise<void> => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: parseInt(req.params.hid),
            },
          },
        });
        if (!onboarding) throw new ErrorHandler(HTTP.NotFound);
        if (onboarding.state != HostOnboardingState.AwaitingChanges)
          throw new ErrorHandler(HTTP.BadRequest, ErrCode.LOCKED);

        // TODO: verify all steps filled out
        // TODO: delete all previous version step reviews
        onboarding.last_submitted = unixTimestamp();
        onboarding.state = HostOnboardingState.PendingVerification;
        onboarding.version += 1;
        await onboarding.save();
      },
    };
  }
}

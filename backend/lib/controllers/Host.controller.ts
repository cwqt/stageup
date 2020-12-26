import {
  HostOnboardingStep,
  HostPermission,
  IHost,
  IHostOnboardingState,
  IOnboardingAddMembers,
  IOnboardingOwnerDetails,
  IOnboardingProofOfBusiness,
  IOnboardingSocialPresence,
  IOnboardingStep,
  IOnboardingSubscriptionConfiguration,
  IUser,
  IUserHostInfo,
  pick,
} from '@eventi/interfaces';
import { Request } from 'express';
import { User } from '../models/Users/User.model';
import { Host } from '../models/Hosts/Host.model';
import { ErrorHandler } from '../common/errors';
import { HTTP } from '@eventi/interfaces';
import { UserHostInfo } from '../models/Hosts/UserHostInfo.model';
import { BaseController, BaseArgs, IControllerEndpoint } from '../common/controller';
import { HostOnboardingProcess } from '../models/Hosts/Onboarding.model';
import { IHostOnboardingProcess } from '@eventi/interfaces';
import AuthStrat from '../authorisation';
import { body, params, query } from '../common/validate';
import Validators from '../common/validators';

export default class HostController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  createHost(): IControllerEndpoint<IHost> {
    return {
      validators: [
        body<{
          username: IHost['username'];
          name: IHost['username'];
          email_address: IHost['username'];
        }>({
          username: (v) =>
            v
              .not()
              .isEmpty()
              .withMessage('Must provide a host username')
              .isLength({ min: 6 })
              .withMessage('Host username length must be >6 characters')
              .isLength({ max: 32 })
              .withMessage('Host username length must be <32 characters')
              .matches(/^[a-zA-Z0-9]*$/)
              .withMessage('Must be alpha-numeric with no spaces'),
          name: (v) =>
            v
              .not()
              .isEmpty()
              .withMessage('Must provide a host name')
              .isLength({ min: 6 })
              .withMessage('Host name length must be >6 characters')
              .isLength({ max: 32 })
              .withMessage('Host name length must be <32 characters'),
          email_address: (v) =>
            v
              .not()
              .isEmpty()
              .withMessage('Must provide an e-mail address')
              .isEmail()
              .normalizeEmail()
              .withMessage('Not a valid e-mail address'),
        }),
      ],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IHost> => {
        const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
        if (user.host) throw new ErrorHandler(HTTP.Conflict, 'Cannot create host if you are already part of another');

        const h = await Host.findOne({ username: req.body.username });
        if (h) throw new ErrorHandler(HTTP.Conflict, `Host username '${h.username}' is already taken`);

        // Create host & add current user (creator) to it through transaction
        // & begin the onboarding process by running setup
        return await this.dc.torm.transaction(async (txc) => {
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

  readHostMembers(): IControllerEndpoint<IUser[]> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IUser[]> => {
        const host = await Host.findOne({ _id: parseInt(req.params.hid) }, { relations: ['members'] });
        return host.members.map((u: User) => u.toFull());
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
        if (!user.host) throw new ErrorHandler(HTTP.NotFound, 'User is not part of any host');

        // const userHostInfo = await UserHostInfo.findOne({
        //   relations: ['user', 'host'],
        //   where: {
        //     user: { _id: user._id },
        //     host: { _id: user.host._id },
        //   },
        // });
        const userHostInfo = {} as UserHostInfo;

        if (userHostInfo.permissions != HostPermission.Owner)
          throw new ErrorHandler(HTTP.Unauthorised, 'Only host owner can delete host');

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
          user: (v) => v.exists().toInt(),
        }),
      ],
      controller: async (req: Request): Promise<IUserHostInfo> => {
        // const uhi = await UserHostInfo.findOne({
        //   relations: ['host', 'user'],
        //   where: {
        //     user: {
        //       _id: parseInt(req.query.user as string),
        //     },
        //     host: {
        //       _id: parseInt(req.params.hid),
        //     },
        //   },
        // });

        // return uhi;
        return {} as IUserHostInfo;
      },
      authStrategy: AuthStrat.none,
    };
  }

  readOnboardingProcessStatus(): IControllerEndpoint<IHostOnboardingProcess> {
    return {
      authStrategy: AuthStrat.none, //AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async (req: Request): Promise<IHostOnboardingProcess> => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: parseInt(req.params.hid),
            },
          },
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
          step: (v) => v.exists().toInt().isIn(Object.values(HostOnboardingStep)),
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
        // TODO: fix typing on onboarding to use string enum
        return (<any>onboarding).steps[req.params.step] as IOnboardingStep<any>;
      },
    };
  }

  /**
   * @description Update Process as a Host Owner/Admin
   */
  updateOnboardingProcess(): IControllerEndpoint<IHostOnboardingProcess> {
    return {
      authStrategy: AuthStrat.isLoggedIn, //AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async (req: Request): Promise<IHostOnboardingProcess> => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: parseInt(req.params.hid),
            },
          },
        });
        if (!onboarding) throw new ErrorHandler(HTTP.NotFound);

        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) throw new ErrorHandler(HTTP.NotFound);

        onboarding.last_modified_by = user;
        onboarding.last_modified = Math.floor(Date.now() / 1000);
        return (await onboarding.save()).toFull();
      },
    };
  }

  updateOnboardingProcessStep(): IControllerEndpoint<IOnboardingStep<any>> {
    return {
      validators: [
        params<{ step: number }>({
          step: (v) => v.exists().toInt().isIn(Object.values(HostOnboardingStep)),
        }),
      ],
      authStrategy: AuthStrat.isLoggedIn, //AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async (req: Request): Promise<IOnboardingStep<any>> => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: parseInt(req.params.hid),
            },
          },
        });
        if (!onboarding) throw new ErrorHandler(HTTP.NotFound);

        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) throw new ErrorHandler(HTTP.NotFound);

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
          throw new ErrorHandler(HTTP.BadRequest, null, error);
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
        if (onboarding.status != IHostOnboardingState.AwaitingChanges)
          throw new ErrorHandler(HTTP.BadRequest, 'Cannot re-submit');

        // TODO: verify all steps filled out
        onboarding.status = IHostOnboardingState.Pending;
        onboarding.version++;
        await onboarding.save();
      },
    };
  }
}

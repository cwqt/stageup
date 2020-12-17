import { HostPermission, IHost, IUser, IUserHostInfo } from '@eventi/interfaces';
import { Request } from 'express';
import { User } from '../models/User.model';
import { DataClient } from '../common/data';
import { Host } from '../models/Host.model';
import { ErrorHandler } from '../common/errors';
import { HTTP } from '@eventi/interfaces';
import { UserHostInfo } from '../models/UserHostInfo.model';
import { validate } from '../common/validate';
import { body, query } from 'express-validator';
import { BaseController, BaseArgs, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../authorisation';

export default class HostController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  createHost(): IControllerEndpoint<IHost> {
    return {
      validator: validate([
        body('username')
          .not()
          .isEmpty()
          .withMessage('Must provide a host username')
          .isLength({ min: 6 })
          .withMessage('Host username length must be >6 characters')
          .isLength({ max: 32 })
          .withMessage('Host username length must be <32 characters')
          .matches(/^[a-zA-Z0-9]*$/)
          .withMessage('Must be alpha-numeric with no spaces'),
        body('name')
          .not()
          .isEmpty()
          .withMessage('Must provide a host name')
          .isLength({ min: 6 })
          .withMessage('Host name length must be >6 characters')
          .isLength({ max: 32 })
          .withMessage('Host name length must be <32 characters'),
        body('email_address')
          .not()
          .isEmpty()
          .withMessage('Must provide an e-mail address')
          .isEmail()
          .normalizeEmail()
          .withMessage('Not a valid e-mail address'),
      ]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IHost> => {
        const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
        if (user.host) throw new ErrorHandler(HTTP.Conflict, 'Cannot create host if already part of another');

        const h = await Host.findOne({ username: req.body.username });
        if (h) throw new ErrorHandler(HTTP.Conflict, `Username '${h.username}' is already taken`);

        const host = new Host({
          username: req.body.username,
          name: req.body.name,
          email_address: req.body.email_address,
        });

        // Create host & add current user (creator) to it through transaction
        await this.dc.torm.transaction(async (transEntityManager) => {
          await transEntityManager.save(host);
          await host.addMember(user, HostPermission.Owner, transEntityManager);
        });

        // addMember saves to db
        return host.toFull();
      },
    };
  }

  getHostMembers(): IControllerEndpoint<IUser[]> {
    return {
      validator: validate([]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IUser[]> => {
        const host = await Host.findOne({ _id: parseInt(req.params.hid) }, { relations: ['members'] });
        return host.members.map((u: User) => u.toFull());
      },
    };
  }

  updateHost(): IControllerEndpoint<void> {
    return {
      validator: validate([]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {},
    };
  }

  deleteHost(): IControllerEndpoint<void> {
    return {
      validator: validate([]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {
        const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
        if (!user.host) throw new ErrorHandler(HTTP.NotFound, 'User is not part of any host');

        const userHostInfo = await UserHostInfo.findOne({
          relations: ['user', 'host'],
          where: {
            user: { _id: user._id },
            host: { _id: user.host._id },
          },
        });

        if (userHostInfo.permissions != HostPermission.Owner)
          throw new ErrorHandler(HTTP.Unauthorised, 'Only host owner can delete host');

        // TODO: transactionally remove performances, signing keys, host infos etc etc.
        await user.host.remove();
      },
    };
  }

  addUser(): IControllerEndpoint<void> {
    return {
      validator: validate([]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {},
    };
  }

  removeUser(): IControllerEndpoint<void> {
    return {
      validator: validate([]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {},
    };
  }

  alterMemberPermissions(): IControllerEndpoint<void> {
    return {
      validator: validate([]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {},
    };
  }

  updateOnboarding(): IControllerEndpoint<void> {
    return {
      validator: validate([]),
      authStrategies: [AuthStrat.hasHostPermission(HostPermission.Owner)],
      controller: async (req: Request): Promise<void> => {},
    };
  }

  getUserHostInfo(): IControllerEndpoint<IUserHostInfo> {
    return {
      validator: validate([query('user').trim().not().isEmpty().toInt()]),
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
      authStrategies: [AuthStrat.none],
    };
  }
}

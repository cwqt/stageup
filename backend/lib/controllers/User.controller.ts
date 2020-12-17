import { HostPermission, IEnvelopedData, IHost, IUser, IUserHostInfo, IMyself } from '@eventi/interfaces';
import { IControllerEndpoint, BaseArgs, BaseController } from '../common/controller';
import { Request } from 'express';
import { body, param } from 'express-validator';
import { ErrorHandler, FormErrorResponse } from '../common/errors';
import { HTTP } from '@eventi/interfaces';
import { validate } from '../common/validate';
import config from '../config';
import AuthStrat from '../authorisation';

import { User } from '../models/User.model';
import { Host } from '../models/Host.model';
import { UserHostInfo } from '../models/UserHostInfo.model';
import Email = require('../common/email');

export default class UserController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  loginUser(): IControllerEndpoint<IUser> {
    return {
      validator: validate([
        body('email_address')
          .not()
          .isEmpty()
          .withMessage('Must provide an e-mail address')
          .isEmail()
          .normalizeEmail()
          .withMessage('Not a valid e-mail address'),
        body('password').not().isEmpty().isLength({ min: 6 }).withMessage('Password length must be > 6 characters'),
      ]),
      preMiddlewares: [this.mws.limiter(3600, 10)],
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IUser> => {
        const emailAddress = req.body.email_address;
        const password = req.body.password;

        const u: User = await User.findOne({ email_address: emailAddress });
        if (!u) throw new ErrorHandler(HTTP.NotFound, 'Incorrect e-mail or password');

        if (!u.is_verified)
          throw new ErrorHandler(
            HTTP.Unauthorised,
            'Your account has not been verified, please check your email address for verification e-mail'
          );

        const match = await u.verifyPassword(password);
        if (!match) throw new ErrorHandler(HTTP.Unauthorised, 'Incorrect e-mail or password');

        req.session.user = {
          _id: u._id,
          is_admin: u.is_admin || false,
        };

        return u.toFull();
      },
    };
  }

  readMyself(): IControllerEndpoint<IMyself> {
    return {
      validator: validate([]),
      preMiddlewares: [],
      postMiddlewares: [],
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IMyself> => {
        const user: User = await User.findOne({ _id: req.session.user._id });
        if (!user) throw new ErrorHandler(HTTP.NotFound, 'No such user exists');

        const host: Host = await Host.findOne({
          where: {
            members: {
              _id: user._id,
            },
          },
        });

        let host_info: IUserHostInfo;
        if (host) {
          host_info = await UserHostInfo.findOne({
            where: {
              user: {
                _id: user._id,
              },
              host: {
                _id: host._id,
              },
            },
          });
        }

        return {
          user: user.toFull(),
          host: host?.toStub(),
          host_info: host_info,
        };
      },
    };
  }

  createUser(): IControllerEndpoint<IUser> {
    return {
      validator: validate([
        body('username').not().isEmpty().trim().withMessage('Username cannot be empty'),
        body('email_address').isEmail().normalizeEmail().withMessage('Not a valid email address'),
        body('password').not().isEmpty().isLength({ min: 6 }).withMessage('Password length must be >6 characters'),
      ]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IUser> => {
        const preExistingUser = await User.findOne({
          where: [{ email_address: req.body.email_address }, { username: req.body.username }],
        });

        if (preExistingUser) {
          const errors = new FormErrorResponse();
          if (preExistingUser.username == req.body.username)
            errors.push('username', 'Username is already taken', req.body.username);
          if (preExistingUser.email_address == req.body.email_address)
            errors.push('email_address', 'Email is already in use', req.body.email_address);
          throw new ErrorHandler(HTTP.Conflict, 'Duplicate data in user form', errors.value);
        }

        const emailSent = await Email.sendVerificationEmail(req.body.email_address);
        if (!emailSent) throw new ErrorHandler(HTTP.ServerError, 'Verification email could not be sent');

        const u = new User({
          username: req.body.username,
          email_address: req.body.email_address,
          password: req.body.password,
        });

        return (await this.dc.torm.manager.save(u))?.toFull();
      },
    };
  }

  logoutUser(): IControllerEndpoint<void> {
    return {
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {
        req.session.destroy((err) => {
          if (err) throw new ErrorHandler(HTTP.ServerError, 'Logging out failed');
          return;
        });
      },
    };
  }

  readUserByUsername(): IControllerEndpoint<IUser> {
    return {
      validator: validate([param('username').trim().not().isEmpty()]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IUser> => {
        const u: User = await User.findOne({ username: req.params.username });
        if (!u) throw new ErrorHandler(HTTP.NotFound, 'No such user exists');

        return u.toFull();
      },
    };
  }

  readUserById(): IControllerEndpoint<IUser> {
    return {
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IUser> => {
        let u: User = (await User.find({ _id: parseInt(req.params.uid) }))[0];
        if (!u) throw new ErrorHandler(HTTP.NotFound, 'No such user exists');

        return u.toFull();
      },
    };
  }

  updateUser(): IControllerEndpoint<IUser> {
    return {
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IUser> => {
        let u: User = (await User.find({ _id: parseInt(req.params.uid) }))[0];
        if (!u) throw new ErrorHandler(HTTP.NotFound, 'No such user exists');

        u = await u.update({ name: req.body.name });
        return u.toFull();
      },
    };
  }

  deleteUser(): IControllerEndpoint<void> {
    return {
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {
        let u: User = (await User.find({ _id: parseInt(req.params.uid) }))[0];
        if (!u) throw new ErrorHandler(HTTP.NotFound, 'No such user exists');
        await u.remove();
        return;
      },
    };
  }

  getUserHost(): IControllerEndpoint<IEnvelopedData<IHost, IUserHostInfo>> {
    return {
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IEnvelopedData<IHost, IUserHostInfo>> => {
        const user = await User.createQueryBuilder('user').leftJoinAndSelect('user.host', 'host').getOne();
        if (!user.host) throw new ErrorHandler(HTTP.NotFound, 'User is not part of any host');

        const host = await Host.findOne({ _id: user.host._id });

        return {
          data: host.toFull(),
          __client_data: {
            //TODO: get host info and insert here
            permissions: HostPermission.Admin,
            joined_at: 0,
          },
        };
      },
    };
  }

  updateUserAvatar(): IControllerEndpoint<IUser> {
    return {
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IUser> => {
        // TODO: assets with s3
        return {} as IUser;
      },
    };
  }

  resetPassword(): IControllerEndpoint<void> {
    return {
      validator: validate([
        body('new_password')
          .not()
          .isEmpty()
          .isLength({ min: 6 })
          .withMessage('New password length must be >6 characters'),
        body('old_password')
          .not()
          .isEmpty()
          .isLength({ min: 6 })
          .withMessage('Old password length must be >6 characters'),
      ]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {
        const oldPassword = req.body.old_password;
        const newPassword = req.body.new_password;

        const u = await User.findOne({ _id: parseInt(req.params.uid) });
        if (!u) throw new ErrorHandler(HTTP.NotFound, 'No such user exists');

        // Check supplied password is valid
        const match = await u.verifyPassword(oldPassword);
        if (!match) throw new ErrorHandler(HTTP.Unauthorised, 'Invalid password');

        u.setPassword(newPassword);
        await u.save();

        await Email.sendEmail({
          from: config.EMAIL_ADDRESS,
          to: u.email_address,
          subject: `Your password was just changed`,
          html: `<p>
      Your account password has recently been changed.<br/><br/>
      If you did not make this change, please change your password assoon as possible. If you have recently changed your password, then please ignore this email.
      </p>`,
        });
      },
    };
  }

  readUserHostPermissions(): IControllerEndpoint<void> {
    return {
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {},
    };
  }

  readUserFeed(): IControllerEndpoint<void> {
    return {
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {},
    };
  }
}

import {
  HostPermission,
  IEnvelopedData,
  IHost,
  IUser,
  IUserHostInfo,
  IMyself,
  IAddress,
  IUserPrivate,
  Idless,
  ErrCode
} from '@eventi/interfaces';
import { IControllerEndpoint, BaseArguments, BaseController } from '../common/controller';
import { Request } from 'express';
import { body, params } from '../common/validate';
import { ErrorHandler, FormErrorResponse, getCheck } from '../common/errors';
import { HTTP } from '@eventi/interfaces';
import Email = require('../common/email');
import config from '../config';
import AuthStrat from '../common/authorisation';

import { User } from '../models/Users/user.model';
import { Host } from '../models/hosts/host.model';
import { Address } from '../models/Users/address.model';
import { EntityManager } from 'typeorm';
import Validators from '../common/validate';

export default class UserController extends BaseController {
  constructor(...args: BaseArguments) {
    super(...args);
  }

  loginUser(): IControllerEndpoint<IUser> {
    return {
      validators: [
        body<Pick<IUserPrivate, 'email_address'> & { password: string }>({
          email_address: v => Validators.Fields.email(v),
          password: v => Validators.Fields.password(v)
        })
      ],
      preMiddlewares: [this.mws.limiter(3600, 10)],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IUser> => {
        const emailAddress = req.body.email_address;
        const password = req.body.password;

        const u = await getCheck(User.findOne({ email_address: emailAddress }));
        if (!u.is_verified) throw new ErrorHandler(HTTP.Unauthorised, ErrCode.NOT_VERIFIED);

        const match = await u.verifyPassword(password);
        if (!match) throw new ErrorHandler(HTTP.Unauthorised, ErrCode.INCORRECT);

        req.session.user = {
          _id: u._id,
          is_admin: u.is_admin || false
        };

        return u.toFull();
      }
    };
  }

  readMyself(): IControllerEndpoint<IMyself> {
    return {
      validators: [],
      preMiddlewares: [],
      postMiddlewares: [],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async (req: Request): Promise<IMyself> => {
        const user = await getCheck(User.findOne({ _id: req.session.user._id }));
        const host: Host = await Host.findOne({
          relations: {
            members_info: {
              user: true
            }
          },
          where: {
            members_info: {
              user: {
                _id: user._id
              }
            }
          }
        });

        return {
          user: user.toFull(),
          host: host?.toStub(),
          host_info: host ? host.members_info.find(uhi => uhi.user._id == user._id)?.toFull() : null
        };
      }
    };
  }

  createUser(): IControllerEndpoint<IUser> {
    return {
      validators: [
        body<Pick<IUserPrivate, 'username' | 'email_address'> & { password: string }>({
          username: v => Validators.Fields.username(v),
          email_address: v => Validators.Fields.email(v),
          password: v => Validators.Fields.password(v)
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IUser> => {
        const preExistingUser = await User.findOne({
          where: [{ email_address: req.body.email_address }, { username: req.body.username }]
        });

        // Check if a some fields are already in use by someone else
        const errors = new FormErrorResponse();
        if (preExistingUser?.username == req.body.username) errors.push('username', ErrCode.IN_USE, req.body.username);
        if (preExistingUser?.email_address == req.body.email_address)
          errors.push('email_address', ErrCode.IN_USE, req.body.email_address);
        if (errors.errors.length > 0) throw new ErrorHandler(HTTP.Conflict, ErrCode.IN_USE, errors.value);

        // Fire off a verification email
        const emailSent = await Email.sendVerificationEmail(req.body.email_address);
        if (!emailSent) throw new ErrorHandler(HTTP.ServerError, ErrCode.EMAIL_SEND);

        // Save the user through a transaction (creates ContactInfo & Person)
        const user = await this.ORM.transaction(async (txc: EntityManager) => {
          const u = await new User({
            username: req.body.username,
            email_address: req.body.email_address,
            password: req.body.password
          }).setup(txc);

          // First user to be created will be an admin
          u.is_admin = (await txc.createQueryBuilder(User, 'u').getCount()) == 0;

          await txc.save(u);
          return u;
        });

        return user.toFull();
      }
    };
  }

  logoutUser(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {
        req.session.destroy(err => {
          if (err) throw new ErrorHandler(HTTP.ServerError);
          return;
        });
      }
    };
  }

  readUserByUsername(): IControllerEndpoint<IUser> {
    return {
      validators: [
        params<Pick<IUserPrivate, 'username'>>({
          username: v => v.trim().notEmpty()
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IUser> => {
        let u = await getCheck(User.findOne({ username: req.params.username }));
        return u.toFull();
      }
    };
  }

  readUserById(): IControllerEndpoint<IUser> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IUser> => {
        let u = await getCheck(User.findOne({ _id: parseInt(req.params.uid) }));
        return u.toFull();
      }
    };
  }

  updateUser(): IControllerEndpoint<IUser> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IUser> => {
        let u = await getCheck(User.findOne({ _id: parseInt(req.params.uid) }));
        u = await u.update({ name: req.body.name });
        return u.toFull();
      }
    };
  }

  deleteUser(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {
        const u = await getCheck(User.findOne({ _id: parseInt(req.params.uid) }));
        await u.remove();
        return;
      }
    };
  }

  readUserHost(): IControllerEndpoint<IEnvelopedData<IHost, IUserHostInfo>> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IEnvelopedData<IHost, IUserHostInfo>> => {
        const user = await User.createQueryBuilder('user').leftJoinAndSelect('user.host', 'host').getOne();
        if (!user.host) throw new ErrorHandler(HTTP.NotFound, ErrCode.NOT_MEMBER);

        const host = await Host.findOne({ _id: user.host._id });

        return {
          data: host.toFull(),
          __client_data: {
            //TODO: get host info and insert here
            permissions: HostPermission.Admin,
            joined_at: 0
          }
        };
      }
    };
  }

  updateUserAvatar(): IControllerEndpoint<IUser> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IUser> => {
        // TODO: assets with s3
        return {} as IUser;
      }
    };
  }

  forgotPassword(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {}
    };
  }

  resetPassword(): IControllerEndpoint<void> {
    return {
      validators: [
        body<{ new_password: string; old_password: string }>({
          new_password: v => Validators.Fields.password(v).withMessage('New password length must be >6 characters'),
          old_password: v => Validators.Fields.password(v).withMessage('Old password length must be >6 characters')
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {
        const oldPassword = req.body.old_password;
        const newPassword = req.body.new_password;
        const u = await getCheck(User.findOne({ _id: parseInt(req.params.uid) }));

        // Check supplied password is valid
        const match = await u.verifyPassword(oldPassword);
        if (!match) throw new ErrorHandler(HTTP.Unauthorised, ErrCode.INCORRECT);

        u.setPassword(newPassword);
        await u.save();

        await Email.sendEmail({
          from: config.EMAIL_ADDRESS,
          to: u.email_address,
          subject: `Your password was just changed`,
          html: `<p>
      Your account password has recently been changed.<br/><br/>
      If you did not make this change, please change your password assoon as possible. If you have recently changed your password, then please ignore this email.
      </p>`
        });
      }
    };
  }

  readUserHostPermissions(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {}
    };
  }

  readUserFeed(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {}
    };
  }

  readAddresses(): IControllerEndpoint<IAddress[]> {
    return {
      authStrategy: AuthStrat.isOurself,
      controller: async (req: Request) => {
        const u = await User.findOne({ _id: parseInt(req.params.uid) }, { relations: ['personal_details'] });
        return (u.personal_details.contact_info.addresses || []).map(a => a.toFull());
      }
    };
  }

  createAddress(): IControllerEndpoint<IAddress> {
    return {
      validators: [body<Idless<IAddress>>(Validators.Objects.IAddress())],
      authStrategy: AuthStrat.isOurself,
      controller: async (req: Request) => {
        const user = await getCheck(
          User.findOne({ _id: parseInt(req.params.uid) }, { relations: ['personal_details'] })
        );

        return await this.ORM.transaction(async (txc: EntityManager) => {
          const address = new Address(req.body);
          await user.personal_details.contact_info.addAddress(address, txc);
          await txc.save(user);
          return address.toFull();
        });
      }
    };
  }

  updateAddress(): IControllerEndpoint<IAddress> {
    return {
      authStrategy: AuthStrat.isOurself,
      controller: async (req: Request) => {
        const address = await Address.findOne({ _id: parseInt(req.params.aid) });
        // TODO: update method in address model

        return address.toFull();
      }
    };
  }

  deleteAddress(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isOurself,
      controller: async (req: Request) => {
        await Address.delete({ _id: parseInt(req.params.aid) });
      }
    };
  }
}

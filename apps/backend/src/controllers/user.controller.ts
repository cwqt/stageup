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
  ErrCode,
  HTTP,
  Environment,
  IUserStub
} from '@core/interfaces';
import {
  IControllerEndpoint,
  BaseController,
  User,
  Host,
  Address,
  Validators,
  body,
  params as parameters,
  ErrorHandler,
  FormErrorResponse,
  getCheck
} from '@core/shared/api';

import Email = require('../common/email');
import Env from '../env';
import AuthStrat from '../common/authorisation';

import { EntityManager } from 'typeorm';
import S3Provider, { S3Return } from 'libs/shared/src/api/providers/aws-s3.provider';

export default class UserController extends BaseController {
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
      controller: async req => {
        const emailAddress = req.body.email_address;
        const password = req.body.password;

        const u = await getCheck(User.findOne({ email_address: emailAddress }));
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
      controller: async req => {
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
          user: { ...user.toFull(), email_address: user.email_address },
          host: host?.toStub(),
          host_info: host ? host.members_info.find(uhi => uhi.user._id === user._id)?.toFull() : null
        };
      }
    };
  }

  createUser(): IControllerEndpoint<IMyself['user']> {
    return {
      validators: [
        body<Pick<IUserPrivate, 'username' | 'email_address'> & { password: string }>({
          username: v => Validators.Fields.username(v),
          email_address: v => Validators.Fields.email(v),
          password: v => Validators.Fields.password(v)
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const preExistingUser = await User.findOne({
          where: [{ email_address: req.body.email_address }, { username: req.body.username }]
        });

        // Check if a some fields are already in use by someone else
        const errors = new FormErrorResponse();
        if (preExistingUser?.username === req.body.username) errors.push('username', ErrCode.IN_USE, req.body.username);
        if (preExistingUser?.email_address === req.body.email_address)
          errors.push('email_address', ErrCode.IN_USE, req.body.email_address);
        if (errors.errors.length > 0) throw new ErrorHandler(HTTP.Conflict, ErrCode.IN_USE, errors.value);

        // Fire & forget off a verification email
        Email.sendVerificationEmail(req.body.email_address);

        // Save the user through a transaction (creates ContactInfo & Person)
        const user = await this.ORM.transaction(async (txc: EntityManager) => {
          const u = await new User({
            username: req.body.username,
            email_address: req.body.email_address,
            password: req.body.password
          }).setup(txc);

          // First user to be created will be an admin
          u.is_admin = (await txc.createQueryBuilder(User, 'u').getCount()) === 0;

          // Verify user if in dev/testing
          u.is_verified = !Env.isEnv([Environment.Production, Environment.Staging]);

          await txc.save(u);
          return u;
        });

        return user.toMyself();
      }
    };
  }

  logoutUser(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        req.session.destroy(error => {
          if (error) {
            throw new ErrorHandler(HTTP.ServerError);
          }
        });
      }
    };
  }

  readUserByUsername(): IControllerEndpoint<IUser> {
    return {
      validators: [
        parameters<Pick<IUserPrivate, 'username'>>({
          username: v => v.trim().notEmpty()
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const u = await getCheck(User.findOne({ username: req.params.username }));
        return u.toFull();
      }
    };
  }

  readUserById(): IControllerEndpoint<IUser> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        const u = await getCheck(User.findOne({ _id: req.params.uid }));
        return u.toFull();
      }
    };
  }

  updateUser(): IControllerEndpoint<IMyself['user']> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        let u = await getCheck(User.findOne({ _id: req.params.uid }));
        u = await u.update({ name: req.body.name });
        return u.toMyself();
      }
    };
  }

  deleteUser(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        const u = await getCheck(User.findOne({ _id: req.params.uid }));
        await u.remove();
      }
    };
  }

  readUserHost(): IControllerEndpoint<IEnvelopedData<IHost, IUserHostInfo>> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        const host = await getCheck(
          Host.findOne({
            relations: { members_info: { user: true } },
            where: {
              members_info: {
                user: {
                  _id: req.params.uid
                }
              }
            }
          })
        );

        return {
          data: host.toFull(),
          __client_data: host.members_info.find(uhi => uhi.user._id == req.params.uid)
        };
      }
    };
  }

  changeAvatar(): IControllerEndpoint<IUserStub> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      preMiddlewares: [this.mws.file(2048, ['image/jpg', 'image/jpeg', 'image/png']).single('file')],
      controller: async (req, dc) => {
        const user = await getCheck(
          User.findOne({
            where: {
              _id: req.params.uid
            }
          })
        );

        const s3: S3Provider = dc.providers['s3'];
        user.avatar = await s3.upload(req.file, user.avatar);

        await user.save();
        return user.toStub();
      }
    };
  }

  // forgotPassword(): IControllerEndpoint<void> {
  //   return {
  //     authStrategy: AuthStrat.none,
  //     controller: async req => {}
  //   };
  // }

  resetPassword(): IControllerEndpoint<void> {
    return {
      validators: [
        body<{ new_password: string; old_password: string }>({
          new_password: v => Validators.Fields.password(v).withMessage('New password length must be >6 characters'),
          old_password: v => Validators.Fields.password(v).withMessage('Old password length must be >6 characters')
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const oldPassword = req.body.old_password;
        const newPassword = req.body.new_password;
        const u = await getCheck(User.findOne({ _id: req.params.uid }));

        // Check supplied password is valid
        const match = await u.verifyPassword(oldPassword);
        if (!match) throw new ErrorHandler(HTTP.Unauthorised, ErrCode.INCORRECT);

        u.setPassword(newPassword);
        await u.save();

        Email.sendEmail({
          from: Env.EMAIL_ADDRESS,
          to: u.email_address,
          subject: 'Your password was just changed',
          html: `<p>
      Your account password has recently been changed.<br/><br/>
      If you did not make this change, please change your password assoon as possible. If you have recently changed your password, then please ignore this email.
      </p>`
        });
      }
    };
  }

  // readUserHostPermissions(): IControllerEndpoint<void> {
  //   return {
  //     authStrategy: AuthStrat.none,
  //     controller: async req => {}
  //   };
  // }

  // readUserFeed(): IControllerEndpoint<void> {
  //   return {
  //     authStrategy: AuthStrat.none,
  //     controller: async req => {}
  //   };
  // }

  readAddresses(): IControllerEndpoint<IAddress[]> {
    return {
      authStrategy: AuthStrat.isOurself,
      controller: async req => {
        const u = await User.findOne({ _id: req.params.uid }, { relations: ['personal_details'] });
        return (u.personal_details.contact_info.addresses || []).map(a => a.toFull());
      }
    };
  }

  createAddress(): IControllerEndpoint<IAddress> {
    return {
      validators: [body<Idless<IAddress>>(Validators.Objects.IAddress())],
      authStrategy: AuthStrat.isOurself,
      controller: async req => {
        const user = await getCheck(User.findOne({ _id: req.params.uid }, { relations: ['personal_details'] }));

        return this.ORM.transaction(async (txc: EntityManager) => {
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
      controller: async req => {
        const address = await Address.findOne({ _id: req.params.aid });
        // TODO: update method in address model

        return address.toFull();
      }
    };
  }

  deleteAddress(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isOurself,
      controller: async req => {
        await Address.delete({ _id: req.params.aid });
      }
    };
  }
}

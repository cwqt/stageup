import { ErrorHandler } from '@backend/common/error';
import {
  Address,
  BaseController,
  Follow,
  getCheck,
  Host,
  IControllerEndpoint,
  PasswordReset,
  User,
  Validators
} from '@core/api';
import {
  Environment,
  HostPermission,
  HTTP,
  IAddress,
  IEnvelopedData,
  IFollowing,
  IHost,
  IMyself,
  IUser,
  IUserHostInfo,
  IUserStub,
  pick
} from '@core/interfaces';
import { fields } from 'libs/shared/src/api/validate/fields.validators';
import { object, string } from 'superstruct';
import { EntityManager } from 'typeorm';
import { BackendProviderMap } from '@backend/common/providers';
import AuthStrat from '../common/authorisation';
import Env from '../env';

import jwt = require('jsonwebtoken');

export default class UserController extends BaseController<BackendProviderMap> {
  loginUser(): IControllerEndpoint<IUser> {
    return {
      validators: { body: Validators.Objects.DtoLogin },
      middleware: this.middleware.rateLimit(3600, 10, this.providers.redis.connection),
      authorisation: AuthStrat.none,
      controller: async req => {
        const emailAddress = req.body.email_address;
        const password = req.body.password;

        const u = await User.findOne({ email_address: emailAddress });
        // Check user exists
        if (!u)
          throw new ErrorHandler(HTTP.NotFound, '@@error.not_found', [
            { path: 'email_address', code: '@@user.not_found' }
          ]);

        // & then verify the password is correct
        if (!(await u.verifyPassword(password)))
          throw new ErrorHandler(HTTP.Unauthorised, '@@error.incorrect', [
            { path: 'password', code: '@@login.password_incorrect' }
          ]);

        // Generate a session token
        req.session.user = {
          _id: u._id,
          is_admin: u.is_admin || false
        };

        return u.toFull();
      }
    };
  }

  createUser(): IControllerEndpoint<IMyself['user']> {
    return {
      validators: { body: Validators.Objects.DtoCreateUser },
      authorisation: AuthStrat.none,
      controller: async req => {
        // Create a Stripe Customer, for purposes of managing cards on our Multi-Party platform
        // https://stripe.com/docs/connect/cloning-saved-payment-methods#storing-customers
        const customer = await this.providers.stripe.connection.customers.create({
          email: req.body.email_address
        });

        // Save the user through a transaction (creates ContactInfo & Person)
        const user = await this.ORM.transaction(async (txc: EntityManager) => {
          const u = await new User({
            username: req.body.username,
            email_address: req.body.email_address,
            password: req.body.password,
            stripe_customer_id: customer.id
          }).setup(txc);

          // First user to be created will be an admin
          u.is_admin = (await txc.createQueryBuilder(User, 'u').getCount()) === 0;

          // Verify user if in dev/testing
          u.is_verified = !Env.isEnv([Environment.Production, Environment.Staging]);

          await txc.save(u);
          return u;
        });

        this.providers.bus.publish(
          'user.registered',
          {
            _id: user._id,
            name: user.name,
            username: user.username,
            email_address: user.email_address
          },
          req.locale
        );

        return user.toMyself();
      }
    };
  }

  logoutUser(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.none,
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
      validators: { params: object({ username: fields.username }) },
      authorisation: AuthStrat.none,
      controller: async req => {
        const u = await getCheck(User.findOne({ username: req.params.username }));
        return u.toFull();
      }
    };
  }

  readUser(): IControllerEndpoint<IUser> {
    return {
      authorisation: AuthStrat.none,
      controller: async req => {
        const u = await getCheck(
          User.findOne(req.params.uid[0] == '@' ? { username: req.params.uid.slice(1) } : { _id: req.params.uid })
        );
        return u.toFull();
      }
    };
  }

  updateUser(): IControllerEndpoint<IMyself['user']> {
    return {
      authorisation: AuthStrat.none,
      validators: { body: Validators.Objects.DtoUpdateUser },
      controller: async req => {
        let u = await getCheck(User.findOne({ _id: req.params.uid }));
        u = await u.update(pick(req.body, ['name', 'avatar', 'bio']));
        return u.toMyself();
      }
    };
  }

  deleteUser(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.none,
      controller: async req => {
        const u = await getCheck(User.findOne({ _id: req.params.uid }));
        await u.remove();
      }
    };
  }

  readUserHost(): IControllerEndpoint<IEnvelopedData<IHost, IUserHostInfo>> {
    return {
      authorisation: AuthStrat.none,
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

  changeAvatar(): IControllerEndpoint<string> {
    return {
      authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
      middleware: this.middleware.file(2048, ['image/jpg', 'image/jpeg', 'image/png']).single('file'),
      controller: async req => {
        const user = await getCheck(
          User.findOne({
            where: {
              _id: req.params.uid
            }
          })
        );

        user.avatar = (await this.providers.blob.upload(req.file, user.avatar)).location;
        await user.save();
        return user.avatar;
      }
    };
  }

  resetPassword(): IControllerEndpoint<void> {
    return {
      validators: { body: Validators.Objects.DtoResetPassword },
      authorisation: AuthStrat.none,
      controller: async req => {
        const oldPassword = req.body.old_password;
        const newPassword = req.body.new_password;
        const u = await getCheck(User.findOne({ _id: req.params.uid }));

        // Check supplied password is valid
        const match = await u.verifyPassword(oldPassword);
        if (!match) throw new ErrorHandler(HTTP.Unauthorised, '@@error.incorrect');

        u.setPassword(newPassword);
        await u.save();

        await this.providers.bus.publish(
          'user.password_changed',
          {
            user_id: u._id
          },
          req.locale
        );
      }
    };
  }

  readAddresses(): IControllerEndpoint<IAddress[]> {
    return {
      authorisation: AuthStrat.isOurself,
      controller: async req => {
        const u = await User.findOne({ _id: req.params.uid }, { relations: ['personal_details'] });
        return (u.personal_details.contact_info.addresses || []).map(a => a.toFull());
      }
    };
  }

  createAddress(): IControllerEndpoint<IAddress> {
    return {
      validators: { body: Validators.Objects.IAddress },
      authorisation: AuthStrat.isOurself,
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
      authorisation: AuthStrat.isOurself,
      controller: async req => {
        const address = await Address.findOne({ _id: req.params.aid });
        // TODO: Update method in address model
        return address.toFull();
      }
    };
  }

  deleteAddress(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.isOurself,
      controller: async req => {
        await Address.delete({ _id: req.params.aid });
      }
    };
  }

  //router.post <void> ("/users/forgot-password", Users.forgotPassword())
  forgotPassword(): IControllerEndpoint<void> {
    return {
      validators: {
        body: object({
          email_address: Validators.Fields.email
        })
      },
      authorisation: AuthStrat.none,
      controller: async req => {
        const emailAddress = req.body.email_address;
        const user = await getCheck(User.findOne({ email_address: emailAddress }));
        const token = jwt.sign({ email_address: emailAddress }, Env.PRIVATE_KEY, { expiresIn: '24h' });

        await PasswordReset.insert({
          otp: token,
          email_address: emailAddress,
          user__id: user._id
        });

        this.providers.bus.publish('user.password_reset_requested', { user_id: user._id, otp: token }, req.locale);
      }
    };
  }

  //router.put <void> ("/users/reset-password", Users.resetForgottenPassword());
  resetForgottenPassword(): IControllerEndpoint<void> {
    return {
      validators: {
        query: object({ otp: string() }),
        body: object({ new_password: string() })
      },
      authorisation: AuthStrat.none,
      controller: async req => {
        const otp = await new Promise((res, rej) => {
          jwt.verify(decodeURI(req.query.otp as string), Env.PRIVATE_KEY, (err, decoded) => {
            if (err) return rej(err);
            res(decoded);
          });
        });

        const user = await getCheck(User.findOne({ email_address: otp['email_address'] }));
        user.setPassword(req.body.new_password);
        await user.save();

        this.providers.bus.publish('user.password_changed', { user_id: user._id }, req.locale);
      }
    };
  }

  readUserFollows(): IControllerEndpoint<IEnvelopedData<IFollowing[]>> {
    return {
      validators: { params: object({ uid: string() }) },
      authorisation: AuthStrat.isLoggedIn,
      controller: async req => {
        return await this.ORM.createQueryBuilder(Follow, 'follow')
          .where('follow.user__id = :uid', { uid: req.params.uid })
          .paginate(follow => follow.toFollowing());
      }
    };
  }
}

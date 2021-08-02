// import { ErrorHandler } from '@backend/common/error';
// import {
//   Address,
//   BaseController,
//   Follow,
//   getCheck,
//   Host,
//   IControllerEndpoint,
//   PasswordReset,
//   User,
//   Validators
// } from '@core/api';
// import {
//   Environment,
//   HostPermission,
//   HTTP,
//   IAddress,
//   IEnvelopedData,
//   IFollowing,
//   IHost,
//   IMyself,
//   IUser,
//   IUserHostInfo,
//   IUserStub,
//   pick
// } from '@core/interfaces';
// import { fields } from 'libs/shared/src/api/validate/fields.validators';
// import { object, string } from 'superstruct';
// import { EntityManager } from 'typeorm';
// import { BackendProviderMap } from '@backend/common/providers';
// import Auth from '../common/authorisation';
// import Env from '../env';

// import jwt = require('jsonwebtoken');
// import { Inject, Service } from 'typedi';
// import { UserService } from '@backend/modules/user/user.service';
// import PostgresProvider from 'libs/shared/src/api/data-client/providers/postgres.provider';
// import EventBusProvider from 'libs/shared/src/api/data-client/providers/event-bus.provider';
// import RedisProvider from 'libs/shared/src/api/data-client/providers/redis.provider';

// @Service()
// export default class UserController {
//   constructor(
//     private orm: PostgresProvider,
//     private bus: EventBusProvider,
//     private redis: RedisProvider,
//     private userService: UserService
//   ) {}

//   loginUser(): IControllerEndpoint<IUser> {
//     return {
//       validators: { body: Validators.Objects.DtoLogin },
//       // middleware: middleware.rateLimit(3600, 10, this.redis.connection),
//       authorisation: Auth.none,
//       controller: async req => {
//         const emailAddress = req.body.email_address;
//         const password = req.body.password;

//         // Check the user exists
//         const user = await this.userService.readUser({ email_address: emailAddress });
//         if (!user)
//           throw new ErrorHandler(HTTP.NotFound, '@@error.not_found', [
//             { path: 'email_address', code: '@@user.not_found' }
//           ]);

//         // & then verify the password is correct
//         if (!(await user.verifyPassword(password)))
//           throw new ErrorHandler(HTTP.Unauthorised, '@@error.incorrect', [
//             { path: 'password', code: '@@login.password_incorrect' }
//           ]);

//         // All valid, generate a session token
//         req.session.user = {
//           _id: user._id,
//           is_admin: user.is_admin || false
//         };

//         return user.toFull();
//       }
//     };
//   }

//   createUser(): IControllerEndpoint<IMyself['user']> {
//     return {
//       validators: { body: Validators.Objects.DtoCreateUser },
//       authorisation: Auth.none,
//       controller: async req => {
//         const existing = await this.userService.readUser({ email_address: req.body.email_address });
//         if (existing) throw new ErrorHandler(HTTP.Conflict, '@@error.email_already_in_use');

//         const user = await this.userService.createUser(req.body);

//         await this.bus.publish(
//           'user.registered',
//           {
//             _id: user._id,
//             name: user.name,
//             username: user.username,
//             email_address: user.email_address
//           },
//           req.locale
//         );

//         return user.toMyself();
//       }
//     };
//   }

//   logoutUser(): IControllerEndpoint<void> {
//     return {
//       authorisation: Auth.none,
//       controller: async req => {
//         req.session.destroy(error => {
//           if (error) throw new ErrorHandler(HTTP.ServerError);
//         });
//       }
//     };
//   }

//   readUser(): IControllerEndpoint<IUser> {
//     return {
//       authorisation: Auth.none,
//       controller: async req => {
//         const u = await getCheck(
//           this.userService.readUser(
//             req.params.uid[0] == '@' ? { username: req.params.uid.slice(1) } : { _id: req.params.uid }
//           )
//         );
//         return u.toFull();
//       }
//     };
//   }

//   updateUser(): IControllerEndpoint<IMyself['user']> {
//     return {
//       authorisation: Auth.none,
//       validators: { body: Validators.Objects.DtoUpdateUser },
//       controller: async req => {
//         let u = await getCheck(User.findOne({ _id: req.params.uid }));
//         u = await u.update(pick(req.body, ['name', 'avatar', 'bio']));
//         return u.toMyself();
//       }
//     };
//   }

//   deleteUser(): IControllerEndpoint<void> {
//     return {
//       authorisation: Auth.none,
//       controller: async req => {
//         const u = await getCheck(User.findOne({ _id: req.params.uid }));
//         await u.remove();
//       }
//     };
//   }

//   readUserHost(): IControllerEndpoint<IEnvelopedData<IHost, IUserHostInfo>> {
//     return {
//       authorisation: Auth.none,
//       controller: async req => {
//         const host = await getCheck(
//           Host.findOne({
//             relations: { members_info: { user: true } },
//             where: {
//               members_info: {
//                 user: {
//                   _id: req.params.uid
//                 }
//               }
//             }
//           })
//         );

//         return {
//           data: host.toFull(),
//           __client_data: host.members_info.find(uhi => uhi.user._id == req.params.uid)
//         };
//       }
//     };
//   }

//   changeAvatar(): IControllerEndpoint<string> {
//     return {
//       authorisation: Auth.hasHostPermission(HostPermission.Admin),
//       middleware: this.middleware.file(2048, ['image/jpg', 'image/jpeg', 'image/png']).single('file'),
//       controller: async req => {
//         const user = await getCheck(
//           User.findOne({
//             where: {
//               _id: req.params.uid
//             }
//           })
//         );

//         user.avatar = (await this.providers.blob.upload(req.file, user.avatar)).location;
//         await user.save();
//         return user.avatar;
//       }
//     };
//   }

//   resetPassword(): IControllerEndpoint<void> {
//     return {
//       validators: { body: Validators.Objects.DtoResetPassword },
//       authorisation: Auth.none,
//       controller: async req => {
//         const oldPassword = req.body.old_password;
//         const newPassword = req.body.new_password;
//         const u = await getCheck(User.findOne({ _id: req.params.uid }));

//         // Check supplied password is valid
//         const match = await u.verifyPassword(oldPassword);
//         if (!match) throw new ErrorHandler(HTTP.Unauthorised, '@@error.incorrect');

//         u.setPassword(newPassword);
//         await u.save();

//         await this.providers.bus.publish(
//           'user.password_changed',
//           {
//             user_id: u._id
//           },
//           req.locale
//         );
//       }
//     };
//   }

//   readAddresses(): IControllerEndpoint<IAddress[]> {
//     return {
//       authorisation: Auth.isOurself,
//       controller: async req => {
//         const u = await User.findOne({ _id: req.params.uid }, { relations: ['personal_details'] });
//         return (u.personal_details.contact_info.addresses || []).map(a => a.toFull());
//       }
//     };
//   }

//   createAddress(): IControllerEndpoint<IAddress> {
//     return {
//       validators: { body: Validators.Objects.IAddress },
//       authorisation: Auth.isOurself,
//       controller: async req => {
//         const address = await this.userService.createAddress(req.body.uid, req.body);
//         return address.toFull();
//       }
//     };
//   }

//   updateAddress(): IControllerEndpoint<IAddress> {
//     return {
//       authorisation: Auth.isOurself,
//       controller: async req => {
//         const address = await this.userService.updateAddress(req.params.aid);
//         return address.toFull();
//       }
//     };
//   }

//   deleteAddress(): IControllerEndpoint<void> {
//     return {
//       authorisation: Auth.isOurself,
//       controller: async req => {
//         await this.userService.deleteAddress(req.params.aid);
//       }
//     };
//   }

//   //router.post <void> ("/users/forgot-password", Users.forgotPassword())
//   requestPasswordReset(): IControllerEndpoint<void> {
//     return {
//       validators: {
//         body: object({
//           email_address: Validators.Fields.email
//         })
//       },
//       authorisation: Auth.none,
//       controller: async req => {
//         const emailAddress = req.body.email_address;
//         const { user, token, reset } = await this.userService.createPasswordReset(req.body.email_address);
//         this.bus.publish('user.password_reset_requested', { user_id: user._id, otp: token }, req.locale);
//       }
//     };
//   }

//   //router.put <void> ("/users/reset-password", Users.resetForgottenPassword());
//   resetForgottenPassword(): IControllerEndpoint<void> {
//     return {
//       validators: {
//         query: object({ otp: string() }),
//         body: object({ new_password: string() })
//       },
//       authorisation: Auth.none,
//       controller: async req => {
//         const otp = await new Promise((res, rej) => {
//           jwt.verify(decodeURI(req.query.otp as string), Env.PRIVATE_KEY, (err, decoded) => {
//             if (err) return rej(err);
//             res(decoded);
//           });
//         });

//         const user = await getCheck(User.findOne({ email_address: otp['email_address'] }));
//         user.setPassword(req.body.new_password);
//         await user.save();

//         this.providers.bus.publish('user.password_changed', { user_id: user._id }, req.locale);
//       }
//     };
//   }

//   readUserFollows(): IControllerEndpoint<IEnvelopedData<IFollowing[]>> {
//     return {
//       validators: { params: object({ uid: string() }) },
//       authorisation: Auth.isLoggedIn,
//       controller: async req => {
//         return await this.ORM.createQueryBuilder(Follow, 'follow')
//           .where('follow.user__id = :uid', { uid: req.params.uid })
//           .paginate(follow => follow.toFollowing());
//       }
//     };
//   }
// }

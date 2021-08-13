// import { Address, getCheck, PasswordReset, transact, User, UserHostInfo } from '@core/api';
// import {
//   DtoCreateUser,
//   Environment,
//   IAddress,
//   IEnvelopedData,
//   IFollowing,
//   IHost,
//   IMyself,
//   IUser,
//   IUserHostInfo
// } from '@core/interfaces';
// import { Service } from 'typedi';
// import Env from '../../env';
// import jwt from 'jsonwebtoken';
// import StripeProvider from 'libs/shared/src/api/data-client/providers/stripe.provider';

// @Service()
// export class UserService {
//   constructor(private stripe: StripeProvider) {}

//   async createUser(data: DtoCreateUser): Promise<User> {
//     // Create a Stripe Customer, for purposes of managing cards on our Multi-Party platform
//     // https://stripe.com/docs/connect/cloning-saved-payment-methods#storing-customers
//     const customer = await this.stripe.connection.customers.create({
//       email: data.email_address
//     });

//     // Save the user through a transaction (creates ContactInfo & Person)
//     return transact(async txc => {
//       const u = await new User({
//         username: data.username,
//         email_address: data.email_address,
//         password: data.password,
//         stripe_customer_id: customer.id
//       }).setup(txc);

//       // First user to be created will be an admin
//       u.is_admin = (await txc.createQueryBuilder(User, 'u').getCount()) === 0;

//       // Verify user if in dev/testing
//       u.is_verified = !Env.isEnv([Environment.Production, Environment.Staging]);

//       return await txc.save(u);
//     });
//   }

//   async readUser(query: Partial<{ email_address: string; _id: string; username: string }>): Promise<User> {
//     return User.findOne(query);
//   }

//   async updateUser(): Promise<IMyself['user']> {}

//   async deleteUser(): Promise<void> {}

//   async readHost(): Promise<{ host: Host; userInfo: UserHostInfo }> {}

//   async changeAvatar(): Promise<string> {}

//   async resetPassword(): Promise<void> {}

//   async readAddresses(): Promise<Address[]> {}

//   async createAddress(userId: string, data: Required<IAddress>): Promise<Address> {
//     return transact(async txc => {
//       const user = await getCheck(User.findOne({ _id: userId }, { relations: ['personal_details'] }));

//       const address = new Address(data);
//       await user.personal_details.contact_info.addAddress(address, txc);
//       await txc.save(user);
//       return address;
//     });
//   }

//   async updateAddress(addressId: string): Promise<Address> {
//     const address = await Address.findOne({ _id: addressId });
//     // TODO: Update method in address model
//     return address;
//   }

//   async deleteAddress(addressId: string): Promise<void> {
//     await Address.delete({ _id: addressId });
//   }

//   async forgotPassword(): Promise<void> {}

//   async createPasswordReset(emailAddress: string): Promise<{ user: User; token: string; reset: PasswordReset }> {
//     const user = await getCheck(User.findOne({ email_address: emailAddress }));
//     const token = jwt.sign({ email_address: emailAddress }, Env.PRIVATE_KEY, { expiresIn: '24h' });

//     const reset = new PasswordReset({
//       otp: token,
//       email_address: emailAddress,
//       user__id: user._id
//     });

//     await reset.save();

//     return { user, token, reset };
//   }

//   async readUserFollows(): Promise<IEnvelopedData<IFollowing[]>> {}
// }

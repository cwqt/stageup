import { UserStageUpMarketingConsent } from './../../../../../libs/shared/src/api/entities/gdpr/consents/user-stageup-marketing-consent.entity';
import { Connection } from 'typeorm';
import { UserHostMarketingConsent } from './../../../../../libs/shared/src/api/entities/gdpr/consents/user-host-marketing-consent.entity';
import { Address, getCheck, PasswordReset, Provider, StripeProvider, STRIPE_PROVIDER, transact, User, Consentable, Host, POSTGRES_PROVIDER } from '@core/api';
import { DtoCreateUser, Environment, IAddress, ConsentOpt } from '@core/interfaces';
import jwt from 'jsonwebtoken';
import { Inject, Service } from 'typedi';
import { ModuleService } from '@core/api';

import Env from '../../env';
import Stripe from 'stripe';

// IMPORTANT when fully implemented remove Partial<>
@Service()
export class UserService extends ModuleService {
  constructor(@Inject(STRIPE_PROVIDER) private stripe: Stripe, @Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
  }

  async createUser(data: DtoCreateUser): Promise<User> {
    // Create a Stripe Customer, for purposes of managing cards on our Multi-Party platform
    // https://stripe.com/docs/connect/cloning-saved-payment-methods#storing-customers
    const customer = await this.stripe.customers.create({
      email: data.email_address
    });

    // Save the user through a transaction (creates ContactInfo & Person)
    return transact(async txc => {
      const u = await new User({
        username: data.username,
        email_address: data.email_address,
        password: data.password,
        stripe_customer_id: customer.id
      }).setup(txc);

      // First user to be created will be an admin
      u.is_admin = (await txc.createQueryBuilder(User, 'u').getCount()) === 0;

      // Verify user if in dev/testing
      u.is_verified = !Env.isEnv([Environment.Production, Environment.Staging]);

      return await txc.save(u);
    });
  }

  async readUser(query: Partial<{ email_address: string; _id: string; username: string }>): Promise<User> {
    return User.findOne(query);
  }

  // async updateUser(): Promise<IMyself['user']> {}

  async deleteUser(): Promise<void> {}

  // async readHost(): Promise<{ host: Host; userInfo: UserHostInfo }> {}

  // async changeAvatar(): Promise<string> {}

  async resetPassword(): Promise<void> {}

  // async readAddresses(): Promise<Address[]> {}

  async createAddress(userId: string, data: Required<IAddress>): Promise<Address> {
    return transact(async txc => {
      const user = await getCheck(User.findOne({ _id: userId }, { relations: ['personal_details'] }));

      const address = new Address(data);
      await user.personal_details.contact_info.addAddress(address, txc);
      await txc.save(user);
      return address;
    });
  }

  async updateAddress(addressId: string): Promise<Address> {
    const address = await Address.findOne({ _id: addressId });
    // TODO: Update method in address model
    return address;
  }

  async deleteAddress(addressId: string): Promise<void> {
    await Address.delete({ _id: addressId });
  }

  async forgotPassword(): Promise<void> {}

  async createPasswordReset(emailAddress: string): Promise<{ user: User; token: string; reset: PasswordReset }> {
    const user = await getCheck(User.findOne({ email_address: emailAddress }));
    const token = jwt.sign({ email_address: emailAddress }, Env.PRIVATE_KEY, { expiresIn: '24h' });

    const reset = new PasswordReset({
      otp: token,
      email_address: emailAddress,
      user__id: user._id
    });

    await reset.save();

    return { user, token, reset };
  }


  async setUserHostMarketingOptStatus(userId: string, hostId: string, optStatus: ConsentOpt) {
    // check if already consenting to this host, if not then soft-opt in
    const existingConsent = await this.ORM.createQueryBuilder(UserHostMarketingConsent, 'c')
    .where('c.user__id = :uid', { uid: userId })
    .andWhere('c.host__id = :hid', { hid: hostId })
    .getOne();

    // Get the latest policies
    const toc = await Consentable.retrieve({ type: 'general_toc' }, 'latest');
    const privacyPolicy = await Consentable.retrieve({ type: 'privacy_policy' }, 'latest');
    const user = await User.findOne({ _id: userId });
    const host = await Host.findOne({ _id: hostId });

    // User is updating the opt in status
    if(existingConsent){
      // Update the status. Also update which documents it is that the user is opting in/out from
      existingConsent.opt_status = optStatus;
      existingConsent.privacy_policy = privacyPolicy;
      existingConsent.terms_and_conditions = toc;
      await existingConsent.save();
    } else {
      // User is opting in/out for the first time
      const newConsent = new UserHostMarketingConsent(optStatus, host, user, toc, privacyPolicy);
      await newConsent.save();
    }
  }

  async setUserSuMarketingOptStatus(userId: string, optingIn: boolean) {
    // check if already consenting to this host, if not then soft-opt in
    const existingConsent = await this.ORM.createQueryBuilder(UserStageUpMarketingConsent, 'c')
      .where('c.user__id = :uid', { uid: userId })
      .getOne();

    // SU marketing doesn't include an opt-in status. It is simply true or false (i.e. it exists in the DB or it does not)
    // Add to database if the user is opting in and the consent doesn't already exist
    if(optingIn && !existingConsent) {
      // Get the latest policies
      const toc = await Consentable.retrieve({ type: 'general_toc' }, 'latest');
      const privacyPolicy = await Consentable.retrieve({ type: 'privacy_policy' }, 'latest');
      const user = await User.findOne({ _id: userId });
      const suMarketingConsent = new UserStageUpMarketingConsent(user, toc, privacyPolicy);
      await suMarketingConsent.save();
    } else if (!optingIn && existingConsent) {
      // Delete if user is opting out and the consent exists in the database
      await existingConsent.remove()
    }
    // Else we carry out no action
  }

  // async readUserFollows(): Promise<IEnvelopedData<IFollowing[]>> {}
}

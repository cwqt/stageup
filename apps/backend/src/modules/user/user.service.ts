import { Connection, EntityManager } from 'typeorm';
import {
  Address,
  getCheck,
  PasswordReset,
  Provider,
  StripeProvider,
  STRIPE_PROVIDER,
  transact,
  User,
  Consentable,
  Host,
  POSTGRES_PROVIDER,
  UserHostMarketingConsent,
  UserStageUpMarketingConsent,
  Like,
  Performance,
  EventBus,
  EVENT_BUS_PROVIDER
} from '@core/api';
import {
  DtoCreateUser,
  Environment,
  IAddress,
  ConsentOpt,
  PlatformConsentOpt,
  ILike,
  LikeLocation,
  ILocale
} from '@core/interfaces';
import jwt from 'jsonwebtoken';
import { Inject, Service } from 'typedi';
import { ModuleService } from '@core/api';

import Env from '../../env';
import Stripe from 'stripe';

// IMPORTANT when fully implemented remove Partial<>
@Service()
export class UserService extends ModuleService {
  constructor(
    @Inject(STRIPE_PROVIDER) private stripe: Stripe,
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus
  ) {
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

  async createAddress(userId: string, data: Required<IAddress>): Promise<Address> {
    return transact(async txc => {
      const user = await getCheck(User.findOne({ _id: userId }, { relations: ['personal_details'] }));

      const address = new Address(data);
      await user.personal_details.contact_info.addAddress(address, txc);
      await txc.save(user);
      return address;
    });
  }

  async deleteAddress(addressId: string): Promise<void> {
    await Address.delete({ _id: addressId });
  }

  async createPasswordReset(emailAddress: string, locale: ILocale): Promise<void> {
    const user = await getCheck(User.findOne({ email_address: emailAddress }));
      const token = jwt.sign({ email_address: emailAddress }, Env.PRIVATE_KEY, { expiresIn: '24h' });

      await transact(async (txc: EntityManager) => {
        const passwordReset = new PasswordReset({
          otp: token,
          email_address: emailAddress,
          user: user
        });

        await txc.save(passwordReset);
      });

      this.bus.publish('user.password_reset_requested', { user_id: user._id, otp: token }, locale);
  }

  async setUserHostMarketingOptStatus(userId: string, hostId: string, optStatus: ConsentOpt) {
    // check if already consenting to this host
    const existingConsent = await this.ORM.createQueryBuilder(UserHostMarketingConsent, 'c')
      .where('c.user__id = :uid', { uid: userId })
      .andWhere('c.host__id = :hid', { hid: hostId })
      .getOne();

    // Return if there is existing consent and it is equal to what the user is setting it to
    if (existingConsent?.opt_status == optStatus) return;

    // User is updating their previous opt-in status
    if (existingConsent) {
      await existingConsent.updateStatus(optStatus);
      await existingConsent.save();
    } else {
      // Get the latest policies
      const toc = await Consentable.retrieve({ type: 'general_toc' }, 'latest');
      const privacyPolicy = await Consentable.retrieve({ type: 'privacy_policy' }, 'latest');
      const user = await User.findOne({ _id: userId });
      const host = await Host.findOne({ _id: hostId });
      // User is opting in/out for the first time
      const newConsent = new UserHostMarketingConsent(optStatus, host, user, toc, privacyPolicy);
      await newConsent.save();
    }
  }

  async setUserPlatformMarketingOptStatus(userId: string, optStatus: PlatformConsentOpt) {
    // check if already consenting to SU marketing
    const existingConsent = await this.ORM.createQueryBuilder(UserStageUpMarketingConsent, 'c')
      .where('c.user__id = :uid', { uid: userId })
      .getOne();

    // Return if there is existing consent and it is equal to what the user is setting it to
    if (existingConsent?.opt_status == optStatus) return;

    // Get the latest policies
    const toc = await Consentable.retrieve({ type: 'general_toc' }, 'latest');
    const privacyPolicy = await Consentable.retrieve({ type: 'privacy_policy' }, 'latest');

    // Add to database if the user is opting in and the consent doesn't already exist
    if (!existingConsent) {
      const user = await User.findOne({ _id: userId });
      const platformMarketingConsent = new UserStageUpMarketingConsent(optStatus, user, toc, privacyPolicy);
      await platformMarketingConsent.save();
    } else {
      await existingConsent.updateStatus(optStatus);
      await existingConsent.save();
    }
  }

  //Checks to make sure we don't add duplicate likes
  async getLike(likeData: ILike): Promise<Like> {
    const qbWhere: { [location in LikeLocation]?: string } = {
      [LikeLocation.HostProfile]: 'like.host__id = :tid',
      [LikeLocation.Performance]: 'like.performance__id = :tid',
      [LikeLocation.Thumb]: 'like.performance__id = :tid',
      [LikeLocation.Brochure]: 'like.performance__id = :tid'
    };

    return await this.ORM.createQueryBuilder(Like, 'like')
      .where('like.user__id = :uid', { uid: likeData.user_id })
      .where(qbWhere[likeData.target_type], { tid: likeData.target_id })
      .getOne();
  }

  async toggleLike(likeData: ILike): Promise<void> {
    // Check current user exists with the session id
    const myself = await getCheck(User.findOne({ _id: likeData.user_id }));

    const existingLike = await this.getLike(likeData);

    const target =
      likeData.target_type === LikeLocation.HostProfile
        ? await getCheck(Host.findOne({ _id: likeData.target_id }))
        : await getCheck(Performance.findOne({ _id: likeData.target_id }));

    // If like exists, we delete. Else we add.
    if (existingLike) {
      // Delete the like and decrement the count in a single transaction
      await transact(async txc => {
        await txc.remove(existingLike);

        // Decrement the like count. Check to ensure it doesn't go negative.
        target.like_count = target.like_count - 1 < 0 ? 0 : target.like_count - 1;
        await txc.save(target);
      });
    } else {
      // Insert the like and increment the count in a single transaction
      await transact(async txc => {
        const like = new Like(myself, likeData.target_type, target);
        await txc.save(like);
        target.like_count++;
        await txc.save(target);
      });
    }
  }
}

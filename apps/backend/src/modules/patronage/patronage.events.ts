// bus.subscribe("patronage.tier_deleted",            handlers.unsubscribeAllPatronTierSubscribers);
// bus.subscribe("patronage.unsubscribe_user",        handlers.unsubscribeFromPatronTier);
// bus.subscribe("patronage.user_unsubscribed",       handlers.sendUserUnsubscribedConfirmationEmail);
// bus.subscribe("patronage.tier_amount_changed",     handlers.transferAllTierSubscribersToNewTier);
// bus.subscribe('patronage.started',       combine([ handlers.sendHostPatronSubscriptionStartedEmail,
//                                                    handlers.sendUserPatronSubscriptionStartedReceiptEmail])

// sendUserPatronSubscriptionStartedReceiptEmail = async (ct: Contract<'patronage.started'>) => {
//   const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'name', 'username'] });
//   const tier = await PatronTier.findOne({ _id: ct.tier_id }, { relations: ['host'] });

//   this.queues.send_email.add({
//     subject: this.providers.i18n.translate('@@email.user.patronage_started__subject', ct.__meta.locale, {
//       tier_name: tier.name
//     }),
//     content: this.providers.i18n.translate('@@email.user.patronage_started__content', ct.__meta.locale, {
//       user_name: user.name || user.username,
//       host_name: tier.host.name || tier.host.username,
//       date_ordinal: dateOrdinal(new Date(), true),
//       tos_url: `${Env.FRONTEND.URL}/${ct.__meta.locale}}/terms_of_service`,
//       amount: i18n.money(tier.amount, tier.currency)
//     }),
//     from: Env.EMAIL_ADDRESS,
//     to: user.email_address,
//     attachments: []
//   });
// };

// unsubscribeAllPatronTierSubscribers = async (ct: Contract<'patronage.tier_deleted'>) => {
//   // For all active subscribers of this subscription, emit the "user.unsubscribe_from_patron_tier" command
//   // onto the event bus - each one must be processed separately, otherwise we may get 1/2 way through all
//   // subscriptions and crash, leaving the other 1/2 of users subscribed
//   const tier = await PatronTier.findOne({
//     where: { _id: ct.tier_id },
//     relations: ['host'],
//     options: { withDeleted: true }
//   });

//   await this.providers.orm.connection
//     .createQueryBuilder(PatronSubscription, 'sub')
//     .where('sub.patron_tier = :tier_id', { tier_id: ct.tier_id })
//     .andWhere('sub.status = :status', { status: PatronSubscriptionStatus.Active })
//     .innerJoinAndSelect('sub.user', 'user')
//     .withDeleted() // patron tier is soft deleted at this point
//     .iterate(async row => {
//       await this.providers.bus.publish(
//         'patronage.unsubscribe_user',
//         { sub_id: row.sub__id, user_id: row.user__id },
//         row.user_locale
//       );

//       // Notify the user that they have been unsubscribed due to the tier being deleted
//       await this.queues.send_email.add({
//         from: Env.EMAIL_ADDRESS,
//         to: row.user_email_address,
//         subject: this.providers.i18n.translate('@@email.subscriber_notify_tier_deleted__subject', row.user_locale),
//         content: this.providers.i18n.translate('@@email.subscriber_notify_tier_deleted__content', row.user_locale, {
//           // streaming rows delivers them as one big fat flat untyped json object :(
//           sub_id: row.sub__id,
//           user_username: row.user_username,
//           host_username: row.tier_host_username,
//           tier_name: row.tier_name
//         }),
//         attachments: []
//       });
//     });
// };

// unsubscribeFromPatronTier = async (ct: Contract<'patronage.unsubscribe_user'>) => {
//   const sub = await PatronSubscription.findOne({
//     where: { _id: ct.sub_id },
//     relations: { host: true },
//     select: { _id: true, stripe_subscription_id: true, host: { _id: true, stripe_account_id: true } },
//     options: { withDeleted: true }
//   });

//   // Initialise the un-subscription process, Stripe will send a webhook on completion
//   // We then emit and event "user.unsubscribed_from_patron_tier" - and another handler will react to that
//   // setting the nessecary states & adding a job to the queue for an email notification
//   await this.providers.stripe.connection.subscriptions.del(sub.stripe_subscription_id, {
//     stripeAccount: sub.host.stripe_account_id
//   });
// };

// sendUserUnsubscribedConfirmationEmail = async (ct: Contract<'patronage.user_unsubscribed'>) => {
//   // Have to use QB for softDeleted relation
//   const sub = await this.providers.orm.connection
//     .createQueryBuilder(PatronSubscription, 'sub')
//     .where('sub._id = :sub_id', { sub_id: ct.sub_id })
//     .innerJoinAndSelect('sub.host', 'host')
//     .innerJoinAndSelect('sub.patron_tier', 'tier')
//     .innerJoinAndSelect('sub.user', 'user')
//     .withDeleted()
//     .getOne();

//   sub.status = PatronSubscriptionStatus.Cancelled;
//   sub.cancelled_at = timestamp();
//   await sub.save();

//   // Notify the user that they have been unsubscribed
//   await this.queues.send_email.add({
//     from: Env.EMAIL_ADDRESS,
//     to: sub.user.email_address,
//     subject: this.providers.i18n.translate('@@email.user_unsubscribed_from_patron_tier__subject', sub.user.locale),
//     content: this.providers.i18n.translate('@@email.user_unsubscribed_from_patron_tier__content', sub.user.locale, {
//       user_username: sub.user.username,
//       host_username: sub.host.username,
//       tier_name: sub.patron_tier.name
//     }),
//     attachments: []
//   });
// };

// transferAllTierSubscribersToNewTier = async (ct: Contract<'patronage.tier_amount_changed'>) => {
//   // for each existing subscriber to the old tier, we need to move them over to the new tier which has the new price
//   const tier = await PatronTier.findOne({ _id: ct.new_tier_id });
//   const host = await Host.findOne({ _id: tier.host__id });

//   await this.providers.orm.connection
//     .createQueryBuilder(PatronSubscription, 'sub')
//     .where('sub.patron_tier = :tier_id', { tier_id: ct.old_tier_id })
//     .andWhere('sub.status = :status', { status: PatronSubscriptionStatus.Active })
//     .innerJoinAndSelect('sub.user', 'user')
//     .withDeleted() // patron tier is soft deleted at this point
//     .iterate(async row => {
//       const stripeSubscriptionId = row.sub_stripe_subscription_id;

//       const subscription = await this.providers.stripe.connection.subscriptions.retrieve(stripeSubscriptionId, {
//         stripeAccount: host.stripe_account_id
//       });

//       // https://stripe.com/docs/billing/subscriptions/upgrade-downgrade#changing
//       await this.providers.stripe.connection.subscriptions.update(
//         stripeSubscriptionId,
//         {
//           cancel_at_period_end: false,
//           proration_behavior: 'create_prorations',
//           items: [
//             {
//               id: subscription.items.data[0].id,
//               price: tier.stripe_price_id
//             }
//           ]
//         },
//         { stripeAccount: host.stripe_account_id }
//       );

//       // update relation of present subscription tier
//       await PatronSubscription.update({ _id: row.sub__id }, { patron_tier: tier });
//     });
// };

// sendHostPatronSubscriptionStartedEmail = async (ct: Contract<'patronage.started'>) => {
//   const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'name', 'username'] });
//   const tier = await PatronTier.findOne({ _id: ct.tier_id }, { relations: ['host'] });
//   this.queues.send_email.add({
//     subject: this.providers.i18n.translate('@@email.host.patronage_started__subject', ct.__meta.locale, {
//       tier_name: tier.name
//     }),
//     content: this.providers.i18n.translate('@@email.host.patronage_started__content', ct.__meta.locale, {
//       tier_name: tier.name,
//       user_username: user.username,
//       host_name: tier.host.name || tier.host.username,
//       amount: i18n.money(tier.amount, tier.currency)
//     }),
//     from: Env.EMAIL_ADDRESS,
//     to: tier.host.email_address,
//     attachments: []
//   });
// };

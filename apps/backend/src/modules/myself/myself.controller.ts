import AuthStrat from '@backend/common/authorisation';
import { ErrorHandler } from '@backend/common/error';
import { SUPPORTED_LOCALES } from '@backend/common/locales';
import {
  EventBus,
  EVENT_BUS_PROVIDER,
  Follow,
  getCheck,
  Host,
  IControllerEndpoint,
  Invoice,
  ModuleController,
  PatronSubscription,
  PaymentMethod,
  Performance,
  PostgresProvider,
  POSTGRES_PROVIDER,
  Refund,
  StripeProvider,
  STRIPE_PROVIDER,
  User,
  UserHostInfo,
  Validators
} from '@core/api';
import { timestamp } from '@core/helpers';
import {
  DtoUserPatronageSubscription,
  HTTP,
  IEnvelopedData,
  IFeed,
  IFollowing,
  ILocale,
  IMyself,
  IPasswordConfirmationResponse,
  IPaymentMethod,
  IPaymentMethodStub,
  IPerformanceStub,
  IRefundRequest,
  IUserHostInfo,
  IUserInvoice,
  IUserInvoiceStub,
  PaymentStatus,
  pick,
  Visibility
} from '@core/interfaces';
import Stripe from 'stripe';
import { boolean, enums, object, record, string } from 'superstruct';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';

@Service()
export class MyselfController extends ModuleController {
  constructor(
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(STRIPE_PROVIDER) private stripe: Stripe
  ) {
    super();
  }

  readMyself: IControllerEndpoint<IMyself> = {
    authorisation: AuthStrat.isLoggedIn,
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
        host: host?.toFull(),
        host_info: host ? host.members_info.find(uhi => uhi.user._id === user._id)?.toFull() : null
      };
    }
  };

  confirmPassword: IControllerEndpoint<IPasswordConfirmationResponse> = {
    validators: { body: object({ password: string() }) },
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const user = await getCheck(User.findOne({ _id: req.session.user._id }));
      const isValid = await user.verifyPassword(req.body.password);
      return { is_valid: isValid };
    }
  };

  readFeed: IControllerEndpoint<IFeed> = {
    validators: {
      query: record(
        enums<keyof IFeed>(['upcoming', 'everything', 'follows', 'hosts']),
        Validators.Objects.PaginationOptions(10)
      )
    },
    authorisation: AuthStrat.none,
    controller: async req => {
      const feed: IFeed = {
        upcoming: null,
        everything: null,
        hosts: null,
        follows: null
      };

      // None of the req.query paging options are present, so fetch the first page of every carousel
      const fetchAll = Object.keys(req.query).every(k => !Object.keys(feed).includes(k));

      if (fetchAll || req.query['upcoming'])
        feed.upcoming = await this.ORM.createQueryBuilder(Performance, 'p')
          .where('p.premiere_datetime > :currentTime', { currentTime: timestamp() })
          .andWhere('p.visibility = :state', { state: Visibility.Public })
          .innerJoinAndSelect('p.host', 'host')
          .orderBy('p.premiere_datetime')
          .leftJoinAndSelect('p.likes', 'likes', 'likes.user__id = :uid', { uid: req.session.user?._id })
          .paginate({
            serialiser: p => p.toClientStub(),
            page: req.query.upcoming ? parseInt((req.query['upcoming'] as any).page) : 0,
            per_page: req.query.upcoming ? parseInt((req.query['upcoming'] as any).per_page) : 4
          });

      if (fetchAll || req.query['everything'])
        feed.everything = await this.ORM.createQueryBuilder(Performance, 'p')
          .andWhere('p.visibility = :state', { state: Visibility.Public })
          .innerJoinAndSelect('p.host', 'host')
          .leftJoinAndSelect('p.likes', 'likes', 'likes.user__id = :uid', { uid: req.session.user?._id })
          .paginate({
            serialiser: p => p.toClientStub(),
            page: req.query.everything ? parseInt((req.query['everything'] as any).page) : 0,
            per_page: req.query.everything ? parseInt((req.query['everything'] as any).per_page) : 4
          });

      if (fetchAll || req.query['hosts'])
        feed.hosts = await this.ORM.createQueryBuilder(Host, 'h').paginate({
          serialiser: p => p.toStub(),
          page: req.query.hosts ? parseInt((req.query['hosts'] as any).page) : 0,
          per_page: req.query.hosts ? parseInt((req.query['hosts'] as any).per_page) : 4
        });

      // User does not need to be logged in for this API request. Therefore we need to first check if user is logged in before getting their follows
      if ((fetchAll || req.query['follows']) && req.session.user) {
        const follows = await this.ORM.createQueryBuilder(Follow, 'follow')
          .where('follow.user__id = :uid', { uid: req.session.user._id })
          .getMany();
        // Map the 'follows' to an array of host IDs
        const hostIds = follows.map(follow => follow.host__id);
        // Query the database for all performances that have a host ID included in the array.
        if (hostIds && hostIds.length > 0) {
          feed.follows = await this.ORM.createQueryBuilder(Performance, 'p')
            .where('p.host IN (:...hostArray)', { hostArray: hostIds })
            .andWhere('p.visibility = :state', { state: Visibility.Public })
            .innerJoinAndSelect('p.host', 'host')
            .leftJoinAndSelect('p.likes', 'likes', 'likes.user__id = :uid', { uid: req.session.user?._id })
            .paginate({
              serialiser: p => p.toClientStub(),
              page: req.query.follows ? parseInt((req.query['follows'] as any).page) : 0,
              per_page: req.query.follows ? parseInt((req.query['follows'] as any).per_page) : 4
            });
        }
      }

      return feed;
    }
  };

  updatePreferredLandingPage: IControllerEndpoint<IUserHostInfo> = {
    validators: {
      body: object({
        prefers_dashboard_landing: boolean()
      })
    },
    authorisation: AuthStrat.isMemberOfAnyHost,
    controller: async req => {
      const uhi = await getCheck(
        UserHostInfo.findOne({
          relations: ['user'],
          where: {
            user: {
              _id: req.session.user._id
            }
          },
          select: {
            user: {
              _id: true
            }
          }
        })
      );

      uhi.prefers_dashboard_landing = req.body.prefers_dashboard_landing;
      await uhi.save();
      return uhi.toFull();
    }
  };

  readMyPurchasedPerformances: IControllerEndpoint<IEnvelopedData<IPerformanceStub[]>> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      return await this.ORM.createQueryBuilder(Invoice, 'invoice')
        .where('invoice.user__id = :user_id', { user_id: req.session.user._id })
        .leftJoinAndSelect('invoice.ticket', 'ticket')
        .leftJoinAndSelect('ticket.performance', 'performance')
        .filter({
          performance_name: { subject: 'performance.name' }
        })
        .innerJoinAndSelect('performance.host', 'host')
        .innerJoinAndSelect('performance.asset_group', 'group')
        .innerJoinAndSelect('group.assets', 'assets')
        .withDeleted() // ticket/performance can be soft removed
        .paginate({ serialiser: i => i.ticket.performance.toStub() });
    }
  };

  readInvoices: IControllerEndpoint<IEnvelopedData<IUserInvoiceStub[]>> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      return await this.ORM.createQueryBuilder(Invoice, 'invoice')
        .where('invoice.user__id = :user_id', { user_id: req.session.user._id })
        .leftJoinAndSelect('invoice.ticket', 'ticket')
        .leftJoinAndSelect('ticket.performance', 'performance')
        .filter({
          performance_name: { subject: 'performance.name' },
          ticket_type: { subject: 'ticket.type' },
          purchased_at: { subject: 'invoice.purchased_at' },
          payment_status: { subject: 'invoice.status' },
          amount: { subject: 'invoice.amount', transformer: v => parseInt(v as string) }
        })
        .sort({
          performance_name: 'performance.name',
          amount: 'invoice.amount',
          purchased_at: 'invoice.purchased_at'
        })
        .innerJoinAndSelect('performance.asset_group', 'group')
        .innerJoinAndSelect('group.assets', 'assets')
        .withDeleted() // ticket/performance can be soft removed
        .paginate({ serialiser: i => i.toUserInvoiceStub() });
    }
  };

  readPatronageSubscriptions: IControllerEndpoint<IEnvelopedData<DtoUserPatronageSubscription[]>> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      return await this.ORM.createQueryBuilder(PatronSubscription, 'sub')
        .where('sub.user__id = :user_id', { user_id: req.session.user._id })
        .leftJoinAndSelect('sub.patron_tier', 'tier')
        .leftJoinAndSelect('sub.last_invoice', 'invoice')
        .filter({
          sub_id: { subject: 'sub._id' },
          sub_status: { subject: 'sub.status' },
          tier_name: { subject: 'tier.name' },
          patron_created: { subject: 'sub.created_at' },
          invoice_amount: { subject: 'invoice.amount', transformer: v => parseInt(v as string) }
        })
        .sort({
          invoice_amount: 'invoice.amount',
          patron_created: 'sub.created_at'
        })
        .withDeleted()
        .paginate({ serialiser: sub => sub.toDtoUserPatronageSubscription() });
    }
  };

  // router.get <IUserInvoice> ("/myself/invoices/:iid", Myself.readInvoice());
  readInvoice: IControllerEndpoint<IUserInvoice> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const invoice = await this.ORM.createQueryBuilder(Invoice, 'invoice')
        .where('invoice._id = :invoice_id', { invoice_id: req.params.iid })
        .innerJoinAndSelect('invoice.ticket', 'ticket')
        .innerJoinAndSelect('ticket.performance', 'performance')
        .innerJoinAndSelect('performance.host', 'host')
        .innerJoinAndSelect('performance.asset_group', 'group')
        .innerJoinAndSelect('group.assets', 'assets')
        .innerJoinAndSelect('invoice.user', 'user')
        .withDeleted()
        .getOne();

      const intent = await this.stripe.paymentIntents.retrieve(
        invoice.stripe_payment_intent_id,
        {
          expand: ['payment_method']
        },
        {
          stripeAccount: invoice.ticket.performance.host.stripe_account_id
        }
      );

      return invoice.toUserInvoice(intent);
    }
  };

  requestInvoiceRefund: IControllerEndpoint<void> = {
    validators: { body: Validators.Objects.RefundInvoiceRequest },
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const refundReq: IRefundRequest = pick(req.body, ['requested_on', 'request_reason', 'request_detail']);

      const invoice = await getCheck(
        Invoice.findOne({
          relations: {
            refunds: true,
            ticket: {
              performance: true
            },
            user: true,
            host: true
          },
          where: {
            _id: req.params.iid,
            user: {
              _id: req.session.user._id
            }
          }
        })
      );

      // Ensure no refund request is currently outstanding before allowing a user
      // to re-request a refund
      if (invoice.refunds.some(i => i.responded_on == null))
        throw new ErrorHandler(HTTP.Forbidden, '@@refunds.refund_already_outstanding');

      await this.ORM.transaction(async txc => {
        const refund = new Refund(invoice, refundReq);
        await txc.save(refund);

        refund.invoice = invoice;
        invoice.status = PaymentStatus.RefundRequested;
        await txc.save(invoice);

        return await txc.save(refund);
      });

      await this.bus.publish('refund.requested', { invoice_id: invoice._id }, req.locale);
    }
  };

  readPaymentMethods: IControllerEndpoint<IPaymentMethodStub[]> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const user = await getCheck(
        User.findOne(
          {
            _id: req.session.user._id
          },
          { relations: { payment_methods: true } }
        )
      );

      return user.payment_methods.map(pm => pm.toStub());
    }
  };

  /**
   * @description Frontend will created the PaymentMethod using Stripe Elements, client will then send us a request containing
   * the new Payment Method Id - now we'll make a copy of that in the DB for faster access
   */
  addCreatedPaymentMethod: IControllerEndpoint<IPaymentMethod> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      // TODO: Set default payment source: https://alacrityfoundationteam31.atlassian.net/browse/SU-884
      const paymentMethodId = req.body.stripe_method_id;
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      // Cross reference with metadata passed when creating PaymentMethod
      if (paymentMethod.metadata.user_id !== req.session.user._id)
        throw new ErrorHandler(HTTP.BadRequest, '@@error.forbidden');

      const myself = await getCheck(User.findOne({ _id: req.session.user._id }));

      // Attach the PaymentMethod to my Stripe Customers' Account
      // https://stripe.com/docs/api/payment_methods/attach
      await this.stripe.paymentMethods.attach(paymentMethod.id, {
        customer: myself.stripe_customer_id
      });

      const method = new PaymentMethod(paymentMethod, myself, req.body.is_primary);
      return (await method.save()).toFull();
    }
  };

  readPaymentMethod: IControllerEndpoint<IPaymentMethod> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const method = await getCheck(
        PaymentMethod.findOne({
          where: {
            _id: req.params.pmid
          }
        })
      );

      return method.toFull();
    }
  };

  deletePaymentMethod: IControllerEndpoint<void> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      // Perform intersection on card ID & User
      const method = await getCheck(
        PaymentMethod.findOne({
          where: {
            _id: req.params.pid,
            user: {
              _id: req.session.user._id
            }
          }
        })
      );

      await this.ORM.transaction(async txc => await method.delete(this.stripe, txc));
    }
  };

  updatePaymentMethod: IControllerEndpoint<IPaymentMethod> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      return {} as any;
    }
  };

  updateLocale: IControllerEndpoint<ILocale> = {
    // Check the locale exists in our currently available options
    validators: {
      body: object({
        language: enums(SUPPORTED_LOCALES.map(l => l.language)),
        region: enums(SUPPORTED_LOCALES.map(l => l.region))
      })
    },
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const myself = await getCheck(User.findOne({ _id: req.session.user._id }));
      myself.locale = req.body;
      await myself.save();
      return myself.locale;
    }
  };

  // Adds a follow to the database with the current users ID (Follower) and the provided host ID (Followee?)
  addFollow: IControllerEndpoint<IFollowing> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      // Check current user exists with the session id
      const myself = await getCheck(User.findOne({ _id: req.session.user._id }));
      // Check host exists with the provided id
      const host = await getCheck(Host.findOne({ _id: req.params.hid }));
      // Check to make sure we don't add duplicate user/host follow relationships
      const followExists = await this.ORM.createQueryBuilder(Follow, 'follow')
        .where('follow.user__id = :uid', { uid: req.session.user._id })
        .andWhere('follow.host__id = :hid', { hid: req.params.hid })
        .getOne();
      // Throw an error if the user is already following this host
      if (followExists) throw new ErrorHandler(HTTP.BadRequest, '@@error.already_following');

      // If we have passed all checks we can add the follow and save to the database
      const follow = new Follow(myself, host);
      await follow.save();
      return follow.toFollowing();
    }
  };

  // Removes a follow to the database with the current users ID (Follower) and the provided host ID (Followee?)
  deleteFollow: IControllerEndpoint<void> = {
    validators: { params: object({ hid: Validators.Fields.nuuid }) },
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const follow = await getCheck(
        this.ORM.createQueryBuilder(Follow, 'follow')
          .where('follow.user__id = :uid', { uid: req.session.user._id })
          .andWhere('follow.host__id = :hid', { hid: req.params.hid })
          .getOne()
      );
      if (follow) await Follow.delete({ _id: follow._id });
    }
  };
}

import {
  AccessToken,
  BaseController,
  ErrorHandler,
  getCheck,
  Host,
  IControllerEndpoint,
  Invoice,
  PatronSubscription,
  PaymentMethod,
  Performance,
  User,
  UserHostInfo,
  Validators
} from '@core/api';
import { timestamp } from '@core/helpers';
import {
  HTTP,
  IEnvelopedData,
  IFeed,
  IMyself,
  IPaymentMethod,
  IPaymentMethodStub,
  IPerformanceStub,
  IRefundRequest,
  IUserHostInfo,
  IUserInvoice,
  IUserInvoiceStub,
  PaymentStatus,
  DtoUserPatronageSubscription,
  Visibility
} from '@core/interfaces';
import { boolean, enums, object, partial, record } from 'superstruct';
import { BackendProviderMap } from '..';
import AuthStrat from '../common/authorisation';

export default class MyselfController extends BaseController<BackendProviderMap> {
  readMyself(): IControllerEndpoint<IMyself> {
    return {
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
  }

  readFeed(): IControllerEndpoint<IFeed> {
    return {
      validators: {
        query: partial(
          record(
            enums<keyof IFeed>(['upcoming', 'everything']),
            Validators.Objects.PaginationOptions(10)
          )
        )
      },
      authorisation: AuthStrat.none,
      controller: async req => {
        const feed: IFeed = {
          upcoming: null,
          everything: null
        };

        // None of the req.query paging options are present, so fetch the first page of every carousel
        const fetchAll = Object.keys(req.query).every(k => !Object.keys(feed).includes(k));

        if (fetchAll || req.query['upcoming'])
          feed.upcoming = await this.ORM.createQueryBuilder(Performance, 'p')
            .where('p.premiere_datetime > :currentTime', { currentTime: timestamp() })
            .andWhere('p.visibility = :state', { state: Visibility.Public })
            .innerJoinAndSelect('p.host', 'host')
            .orderBy('p.premiere_datetime')
            .paginate(p => p.toStub(), {
              page: req.query.upcoming ? parseInt((req.query['upcoming'] as any).page) : 0,
              per_page: req.query.upcoming ? parseInt((req.query['upcoming'] as any).per_page) : 4
            });

        if (fetchAll || req.query['everything'])
          feed.everything = await this.ORM.createQueryBuilder(Performance, 'p')
            .andWhere('p.visibility = :state', { state: Visibility.Public })
            .innerJoinAndSelect('p.host', 'host')
            .paginate(p => p.toStub(), {
              page: req.query.everything ? parseInt((req.query['everything'] as any).page) : 0,
              per_page: req.query.everything ? parseInt((req.query['everything'] as any).per_page) : 4
            });

        return feed;
      }
    };
  }

  updatePreferredLandingPage(): IControllerEndpoint<IUserHostInfo> {
    return {
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
  }

  readMyPurchasedPerformances(): IControllerEndpoint<IEnvelopedData<IPerformanceStub[]>> {
    return {
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
          .paginate(i => i.ticket.performance.toStub());
      }
    };
  }

  readInvoices(): IControllerEndpoint<IEnvelopedData<IUserInvoiceStub[]>> {
    return {
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
          .paginate(i => i.toUserInvoiceStub());
      }
    };
  }

  readPatronageSubscriptions(): IControllerEndpoint<IEnvelopedData<DtoUserPatronageSubscription[]>> {
    return {
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
          .paginate(sub => sub.toDtoUserPatronageSubscription());
      }
    };
  }

  // router.get <IUserInvoice> ("/myself/invoices/:iid", Myself.readInvoice());
  readInvoice(): IControllerEndpoint<IUserInvoice> {
    return {
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

        const charge = await this.providers.stripe.connection.paymentIntents.retrieve(
          invoice.stripe_payment_intent_id,
          {
            expand: ['payment_method']
          },
          {
            stripeAccount: invoice.ticket.performance.host.stripe_account_id
          }
        );
        return invoice.toUserInvoice(charge);
      }
    };
  }

  requestInvoiceRefund(): IControllerEndpoint<void> {
    return {
      // validators: [body<IRefundRequest>(Validators.Objects.refundInvoiceRequest())],
      authorisation: AuthStrat.isLoggedIn,
      controller: async req => {
        const refund: IRefundRequest = req.body;
        const invoice = await getCheck(
          Invoice.findOne({
            relations: {
              user: true
            },
            where: {
              _id: req.params.invoice_id,
              user: {
                _id: req.session.user._id
              }
            }
          })
        );

        invoice.status = PaymentStatus.RefundPending;
        invoice.refund_request = refund;

        await invoice.save();
        this.providers.bus.publish('refund.requested', { invoice_id: invoice._id }, req.locale);
      }
    };
  }

  readPaymentMethods(): IControllerEndpoint<IPaymentMethodStub[]> {
    return {
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
  }

  /**
   * @description Frontend will created the PaymentMethod using Stripe Elements, client will then send us a request containing
   * the new Payment Method Id - now we'll make a copy of that in the DB for faster access
   */
  addCreatedPaymentMethod(): IControllerEndpoint<IPaymentMethod> {
    return {
      authorisation: AuthStrat.isLoggedIn,
      controller: async req => {
        // TODO: Set default payment source: https://alacrityfoundationteam31.atlassian.net/browse/SU-884
        const paymentMethodId = req.body.stripe_method_id;
        const paymentMethod = await this.providers.stripe.connection.paymentMethods.retrieve(paymentMethodId);

        // Cross reference with metadata passed when creating PaymentMethod
        if (paymentMethod.metadata.user_id !== req.session.user._id)
          throw new ErrorHandler(HTTP.BadRequest, '@@error.forbidden');

        const myself = await getCheck(User.findOne({ _id: req.session.user._id }));

        // Attach the PaymentMethod to my Stripe Customers' Account
        // https://stripe.com/docs/api/payment_methods/attach
        await this.providers.stripe.connection.paymentMethods.attach(paymentMethod.id, {
          customer: myself.stripe_customer_id
        });

        const method = new PaymentMethod(paymentMethod, myself, req.body.is_primary);
        return (await method.save()).toFull();
      }
    };
  }

  readPaymentMethod(): IControllerEndpoint<IPaymentMethod> {
    return {
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
  }

  deletePaymentMethod(): IControllerEndpoint<void> {
    return {
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

        await this.ORM.transaction(async txc => await method.delete(this.providers.stripe.connection, txc));
      }
    };
  }

  updatePaymentMethod(): IControllerEndpoint<IPaymentMethod> {
    return {
      authorisation: AuthStrat.isLoggedIn,
      controller: async req => {
        return {} as any;
      }
    };
  }
}

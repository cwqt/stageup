import Env from '@backend/env';
import {
  AccessToken,
  BaseController,
  body,
  getCheck,
  Host,
  IControllerEndpoint,
  Invoice,
  Ticket,
  PaymentMethod,
  query,
  single,
  User,
  UserHostInfo,
  Performance,
  Validators,
  ErrorHandler
} from '@core/api';
import { prettifyMoney, timestamp } from '@core/helpers';
import {
  IEnvelopedData,
  IFeed,
  IMyself,
  IPaymentMethod,
  IPerformanceStub,
  IUserHostInfo,
  IUserInvoice,
  IUserInvoiceStub,
  Visibility,
  PaginationOptions,
  PaymentStatus,
  IRefundRequest,
  IPaymentMethodStub,
  HTTP,
  ErrCode,
  IInvoice
} from '@core/interfaces';
import { BackendProviderMap } from '..';
import AuthStrat from '../common/authorisation';
import moment from "moment";

import Email = require('../common/email');

export default class MyselfController extends BaseController<BackendProviderMap> {
  readMyself(): IControllerEndpoint<IMyself> {
    return {
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
          host: host?.toFull(),
          host_info: host ? host.members_info.find(uhi => uhi.user._id === user._id)?.toFull() : null
        };
      }
    };
  }

  readFeed(): IControllerEndpoint<IFeed> {
    return {
      authStrategy: AuthStrat.none,
      validators: [
        query<{ [index in keyof IFeed]: PaginationOptions }>({
          upcoming: v => v.optional({ nullable: true }).custom(Validators.Objects.PaginationOptions(10)),
          everything: v => v.optional({ nullable: true }).custom(Validators.Objects.PaginationOptions(10))
        })
      ],
      controller: async req => {
        const feed: IFeed = {
          upcoming: null,
          everything: null
        };

        // None of the req.query paging options are present, so fetch the first page of every carousel
        const fetchAll = Object.keys(req.query).every(k => !Object.keys(feed).includes(k));

        if (fetchAll || req.query['upcoming'])
          feed.upcoming = await this.ORM.createQueryBuilder(Performance, 'p')
            .where('p.premiere_date > :currentTime', { currentTime: timestamp() })
            .andWhere('p.visibility = :state', { state: Visibility.Public })
            .innerJoinAndSelect('p.host', 'host')
            .orderBy('p.premiere_date')
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
      validators: [
        body<Pick<IUserHostInfo, 'prefers_dashboard_landing'>>({
          prefers_dashboard_landing: v => v.isBoolean()
        })
      ],
      authStrategy: AuthStrat.isMemberOfAnyHost,
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
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        return await AccessToken.createQueryBuilder('token')
          .where('token.user__id = :uid', { uid: req.session.user._id })
          .leftJoinAndSelect('token.performance', 'performance')
          .andWhere('LOWER(performance.name) LIKE :name', {
            name: req.query.name ? `%${(req.query.name as string).toLowerCase()}%` : '%'
          })
          .leftJoinAndSelect('performance.host', 'host')
          .innerJoinAndSelect('performance.stream', 'stream')
          .paginate(t => t.performance.toStub());
      }
    };
  }

  readInvoices(): IControllerEndpoint<IEnvelopedData<IUserInvoiceStub[]>> {
    return {
      authStrategy: AuthStrat.isLoggedIn,
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
          .innerJoinAndSelect('performance.stream', 'stream')
          .withDeleted() // ticket/performance can be soft removed
          .paginate(i => i.toUserInvoiceStub());
      }
    };
  }

  // router.get <IUserInvoice> ("/myself/invoices/:iid", Myself.readInvoice());
  readInvoice(): IControllerEndpoint<IUserInvoice> {
    return {
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        const invoice = await this.ORM.createQueryBuilder(Invoice, 'invoice')
          .where('invoice._id = :invoice_id', { invoice_id: req.params.iid })
          .innerJoinAndSelect('invoice.ticket', 'ticket')
          .innerJoinAndSelect('ticket.performance', 'performance')
          .innerJoinAndSelect('performance.host', 'host')
          .innerJoinAndSelect('performance.stream', 'stream')
          .innerJoinAndSelect('invoice.user', 'user')
          .withDeleted()
          .getOne();

        const charge = await this.providers.stripe.connection.charges.retrieve(invoice.stripe_charge_id, { stripeAccount: invoice.ticket.performance.host.stripe_account_id});
        return invoice.toHostInvoice(charge);
      }
    };
  }

  requestInvoiceRefund(): IControllerEndpoint<void> {
    return {
      validators: [
        body<IRefundRequest>(
          Validators.Objects.refundInvoiceRequest()
        )
      ],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {

        const refundReq: IRefundRequest = req.body;
        
        const invoice = await getCheck(Invoice.findOne({
          relations: {
            ticket: {
              performance: true
            },
            user: true, 
            host: true 
          },
          where: {
            _id: req.body.invoice_id,
            user: {
              _id: req.session.user._id
            }
          },
        }));
        
        invoice.status = PaymentStatus.RefundPending;
        invoice.refund_request = refundReq;
        
        await invoice.save();

        Email.sendInvoiceRefundRequestConfirmation(invoice);
      }
    };
  }

  readPaymentMethods(): IControllerEndpoint<IPaymentMethodStub[]> {
    return {
      authStrategy: AuthStrat.isLoggedIn,
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
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        // TODO: set default payment source

        const paymentMethodId = req.body.stripe_method_id;
        const paymentMethod = await this.providers.stripe.connection.paymentMethods.retrieve(paymentMethodId);

        // Cross reference with metadata passed when creating PaymentMethod
        if (paymentMethod.metadata.user_id !== req.session.user._id)
          throw new ErrorHandler(HTTP.BadRequest, ErrCode.FORBIDDEN);

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
      authStrategy: AuthStrat.isLoggedIn,
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
      authStrategy: AuthStrat.isLoggedIn,
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
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        return {} as any;
      }
    };
  }
}

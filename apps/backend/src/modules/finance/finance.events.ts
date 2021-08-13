import Env from '@backend/env';
import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import {
  combine,
  Contract,
  EventBus,
  EVENT_BUS_PROVIDER,
  i18n,
  I18N_PROVIDER,
  Invoice,
  Logger,
  LOGGING_PROVIDER,
  ModuleEvents,
  POSTGRES_PROVIDER,
  Refund,
  STRIPE_PROVIDER,
  User
} from '@core/api';
import { pipes } from '@core/helpers';
import moment from 'moment';
import Stripe from 'stripe';
import { Inject, Service } from 'typedi';
import { Connection, In } from 'typeorm';
import { JobQueueService } from '../queue/queue.service';

@Service()
export class FinanceEvents extends ModuleEvents {
  constructor(
    private queueService: JobQueueService,
    @Inject(STRIPE_PROVIDER) private stripe: Stripe,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(LOGGING_PROVIDER) private log: Logger,
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(I18N_PROVIDER) private i18n: i18n<AUTOGEN_i18n_TOKEN_MAP>
  ) {
    super();

    // prettier-ignore
    this.events = {
      ['refund.requested']:           this.sendInvoiceRefundRequestConfirmation,
      ["refund.initiated"]: combine([ this.sendUserRefundInitiatedEmail,
                                      this.sendHostRefundInitiatedEmail,
                                      this.enactStripeRefund]),
      ["refund.refunded"]:  combine([ this.sendUserRefundRefundedEmail,
                                      this.sendHostRefundRefundedEmail]),
      ["refund.bulk"]:                this.processBulkRefunds,
    }
  }

  async sendInvoiceRefundRequestConfirmation(ct: Contract<'refund.requested'>) {
    // FUTURE Have different strategies for different types of purchaseables?
    const invoice = await Invoice.findOne(
      { _id: ct.invoice_id },
      { relations: { user: true, ticket: { performance: true }, host: true } }
    );

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.refund_requested__subject', ct.__meta.locale, {
        host_name: invoice.host.username
      }),
      content: this.i18n.translate('@@email.refund_requested__content', ct.__meta.locale, {
        host_name: invoice.host.name,
        invoice_id: invoice._id,
        performance_name: invoice.ticket.performance.name,
        purchase_date: moment.unix(invoice.purchased_at).format('LLLL'),
        amount: this.i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoice.user.email_address,
      attachments: []
    });
  }

  async sendUserRefundInitiatedEmail(ct: Contract<'refund.initiated'>) {
    const invoice = await this.ORM.createQueryBuilder(Invoice, 'invoice')
      .where('invoice._id = :iid', { iid: ct.invoice_id })
      .innerJoinAndSelect('invoice.ticket', 'ticket')
      .innerJoin('ticket.performance', 'performance')
      .innerJoin('invoice.host', 'host')
      .innerJoin('invoice.payment_method', 'payment_method')
      .addSelect([
        'host.name',
        'performance.name',
        'invoice.ticket',
        'payment_method.brand',
        'invoice._id',
        'invoice.amount',
        'invoice.currency'
      ])
      .withDeleted()
      .getOne();

    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address'] });

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.user.refund_initiated__subject', ct.__meta.locale, {
        host_name: invoice.host.name,
        performance_name: invoice.ticket.performance.name
      }),
      content: this.i18n.translate('@@email.user.refund_initiated__content', ct.__meta.locale, {
        user_username: user.username,
        host_name: invoice.host.name,
        performance_name: invoice.ticket.performance.name,
        last_4: invoice.payment_method.last4,
        card_brand: pipes.cardBrand(invoice.payment_method.brand),
        invoice_id: invoice._id,
        invoice_amount: this.i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  }

  async sendHostRefundInitiatedEmail(ct: Contract<'refund.initiated'>) {
    const invoice = await this.ORM.createQueryBuilder(Invoice, 'invoice')
      .where('invoice._id = :iid', { iid: ct.invoice_id })
      .innerJoinAndSelect('invoice.ticket', 'ticket')
      .innerJoin('ticket.performance', 'performance')
      .innerJoin('invoice.host', 'host')
      .innerJoin('invoice.payment_method', 'payment_method')
      .addSelect([
        'host.name',
        'performance.name',
        'payment_method.brand',
        'invoice._id',
        'invoice.ticket',
        'invoice.amount',
        'invoice.currency'
      ])
      .withDeleted()
      .getOne();

    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address', 'username'] });

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.host.refund_initiated__subject', ct.__meta.locale, {
        user_username: user.username,
        performance_name: invoice.ticket.performance.name
      }),
      content: this.i18n.translate('@@email.host.refund_initiated__content', ct.__meta.locale, {
        host_name: invoice.host.name,
        performance_name: invoice.ticket.performance.name,
        invoice_id: invoice._id,
        invoice_amount: this.i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  }

  async enactStripeRefund(ct: Contract<'refund.initiated'>) {
    const invoice = await this.ORM.createQueryBuilder(Invoice, 'i')
      .where('i._id = :_id', { _id: ct.invoice_id })
      .leftJoinAndSelect('i.host', 'host')
      .getOne();

    await this.stripe.refunds.create(
      {
        payment_intent: invoice.stripe_payment_intent_id
      },
      {
        stripeAccount: invoice.host.stripe_account_id
      }
    );
  }

  async sendUserRefundRefundedEmail(ct: Contract<'refund.refunded'>) {
    const invoice = await this.ORM.createQueryBuilder(Invoice, 'invoice')
      .where('invoice._id = :iid', { iid: ct.invoice_id })
      .innerJoinAndSelect('invoice.ticket', 'ticket')
      .innerJoinAndSelect('ticket.performance', 'performance')
      .innerJoin('invoice.host', 'host')
      .innerJoin('invoice.payment_method', 'payment_method')
      .innerJoin('invoice.user', 'user')
      .addSelect([
        'host.name',
        'performance.name',
        'payment_method.brand',
        'payment_method.last4',
        'invoice._id',
        'invoice.ticket',
        'invoice.amount',
        'invoice.currency',
        'user.username',
        'user.email_address'
      ])
      .withDeleted()
      .getOne();

    const refund = await Refund.findOne({ _id: ct.refund_id });

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.user.refund_refunded__subject', ct.__meta.locale, {
        performance_name: invoice.ticket.performance.name
      }),
      content: this.i18n.translate('@@email.user.refund_refunded__content', ct.__meta.locale, {
        user_username: invoice.user.username,
        host_name: invoice.host.name,
        invoice_id: invoice._id,
        last_4: invoice.payment_method.last4,
        card_brand: pipes.cardBrand(invoice.payment_method.brand),
        invoice_amount: this.i18n.money(invoice.amount, invoice.currency),
        performance_name: invoice.ticket.performance.name,
        refund_reason: pipes.refundReason(refund.request_reason)
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoice.user.email_address,
      attachments: []
    });
  }

  async sendHostRefundRefundedEmail(ct: Contract<'refund.refunded'>) {
    const invoice = await this.ORM.createQueryBuilder(Invoice, 'invoice')
      .where('invoice._id = :iid', { iid: ct.invoice_id })
      .innerJoinAndSelect('invoice.ticket', 'ticket')
      .innerJoin('ticket.performance', 'performance')
      .innerJoin('invoice.host', 'host')
      .innerJoin('invoice.payment_method', 'payment_method')
      .innerJoin('invoice.user', 'user')
      .addSelect([
        'host.name',
        'performance.name',
        'payment_method.brand',
        'payment_method.last4',
        'invoice._id',
        'invoice.ticket',
        'invoice.amount',
        'invoice.currency',
        'user.username'
      ])
      .withDeleted()
      .getOne();

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.host.refund_refunded__subject', ct.__meta.locale, {
        invoice_id: invoice._id,
        user_username: invoice.user.username,
        performance_name: invoice.ticket.performance.name
      }),
      content: this.i18n.translate('@@email.host.refund_refunded__content', ct.__meta.locale, {
        host_name: invoice.host.name,
        user_username: invoice.user.username,
        performance_name: invoice.ticket.performance.name,
        invoice_amount: this.i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoice.host.email_address,
      attachments: []
    });
  }

  async processBulkRefunds(ct: Contract<'refund.bulk'>) {
    const invoices = await Invoice.find({
      relations: {
        ticket: {
          performance: true
        },
        host: true,
        user: true
      },
      where: {
        _id: In(ct.invoice_ids)
      }
    });

    const refundQuantity = invoices.length;

    // Check all invoices are the same currency, error if not
    // if (!invoices.every(i => i.currency === invoices[0].currency))
    //   //TODO remove this error when multi currency implemented
    //   throw new ErrorHandler(HTTP.Forbidden, 'All refunds must be in the same currency');

    const invoicesTotal = this.i18n.money(
      invoices.reduce((acc, curr) => ((acc += +curr.amount), acc), 0),
      invoices[0].currency
    );

    //Send bulk refund initiation email to host
    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.host.refund_bulk_initiated_subject', ct.__meta.locale, {
        refund_quantity: refundQuantity
      }),
      content: this.i18n.translate('@@email.host.refund_bulk_initiated_content', ct.__meta.locale, {
        host_name: invoices[0].host.name,
        refund_quantity: refundQuantity,
        invoices_total: invoicesTotal
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoices[0].host.email_address, //TODO need to change this when we go multi currency
      attachments: []
    });

    //Initiate individual refund jobs

    await Promise.all(
      invoices.map(async invoice => {
        await this.bus.publish(
          'refund.initiated',
          { invoice_id: invoice._id, user_id: invoice.user._id },
          ct.__meta.locale
        );
      })
    );
  }
}

import {
  ErrorHandler,
  EventBus,
  EVENT_BUS_PROVIDER,
  Invoice,
  POSTGRES_PROVIDER,
  Refund,
  PostgresProvider,
  ModuleService
} from '@core/api';
import { HTTP, ILocale } from '@core/interfaces';
import { Inject, Service, Token } from 'typedi';
import { Connection, In } from 'typeorm';
import { IProcessRefund } from './finance.interface';

@Service()
export class FinanceService extends ModuleService {
  constructor(@Inject(EVENT_BUS_PROVIDER) private bus: EventBus, @Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
  }

  public async processRefunds(refundData: IProcessRefund, locale: ILocale) {
    const invoices = await Invoice.find({
      where: {
        _id: In(refundData.invoice_ids),
        host: {
          _id: refundData.host_id
        }
      },
      relations: {
        host: true,
        user: true,
        refunds: {
          invoice: true
        }
      },
      select: {
        host: { _id: true, stripe_account_id: true },
        refunds: true,
        user: true
      }
    });

    // No invoices found for provided ids
    if (invoices.length == 0) throw new ErrorHandler(HTTP.BadRequest, '@@refunds.no_invoices_found');

    // Create an entry in the refund table for bulk refunds where a request was not made
    await Promise.all(
      invoices.map(async invoice => {
        let refundPresent = invoice.refunds.find(refund => refund.invoice._id == invoice._id);

        if (refundPresent === undefined) {
          await this.ORM.transaction(async txc => {
            const refund = await new Refund(invoice, null, refundData.bulk_refund_data);
            refund.invoice = invoice;
            await txc.save(refund);
          });
        }
      })
    );

    if (refundData.invoice_ids.length > 1) {
      return await this.bus.publish(
        'refund.bulk',
        { invoice_ids: refundData.invoice_ids, performance_deletion: refundData.send_initiation_emails },
        locale
      );
    } else {
      return await this.bus.publish(
        'refund.initiated',
        {
          invoice_id: invoices[0]._id,
          user_id: invoices[0].user._id,
          send_initiation_emails: refundData.send_initiation_emails
        },
        locale
      );
    }
  }
}

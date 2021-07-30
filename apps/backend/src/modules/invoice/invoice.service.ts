import { ErrorHandler, Invoice, Refund } from '@core/api';
import { HTTP, IBulkRefund } from '@core/interfaces';
import { In } from 'typeorm';
import { BaseService } from '../base.service';
import * as express from 'express';

export declare type Request = express.Request;
export interface IProcessRefund {
  host_id: string;
  invoice_ids: string[];
  bulk_refund_data: IBulkRefund;
}

export class InvoiceService extends BaseService {
  constructor(req?: Request) {
    super(req);
  }

  public async processRefunds(refundData: IProcessRefund) {
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
          await this.serviceProviderMap.orm.connection.transaction(async txc => {
            const refund = await new Refund(invoice, null, refundData.bulk_refund_data);
            refund.invoice = invoice;
            await txc.save(refund);
          });
        }
      })
    );

    if (refundData.invoice_ids.length > 1) {
      return await this.serviceProviderMap.bus.publish(
        'refund.bulk',
        { invoice_ids: refundData.invoice_ids },
        this.req.locale
      );
    } else {
      return await this.serviceProviderMap.bus.publish(
        'refund.initiated',
        { invoice_id: invoices[0]._id, user_id: invoices[0].user._id },
        this.req.locale
      );
    }
  }
}

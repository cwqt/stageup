import { ErrorHandler, Invoice,  Refund } from "@core/api";
import { HTTP, IBulkRefund } from "@core/interfaces";
import { In } from "typeorm";
import { BaseService } from "../base.service";

export interface IProcessRefundService  {
    host_id: string;
    invoice_ids: string[];
    bulk_refund_data: IBulkRefund;
    providers: ServiceProviderMap;
}

export class InvoiceService extends BaseService {

    public processRefunds(){
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
          this.serviceProviderMap.orm
          // No invoices found for provided ids
          if (invoices.length == 0) throw new ErrorHandler(HTTP.BadRequest, '@@refunds.no_invoices_found');
          this.serviceProviderMap.orm
          // Create an entry in the refund table for bulk refunds where a request was not made
          await Promise.all(
            invoices.map(async invoice => {
              let refundPresent = invoice.refunds.find(refund => refund.invoice._id == invoice._id);
                this.serviceProviderMap
              if (refundPresent === undefined) {
                await this.ORM.transaction(async txc => {
                  const refund = await new Refund(invoice, null, bulkRefundData);
                  refund.invoice = invoice;
                  await txc.save(refund);
                });
              }
            })
          );
  
          if (invoiceIds.length > 1) {
            return await this.providers.bus.publish('refund.bulk', { invoice_ids: invoiceIds }, req.locale);
          } else {
            return await this.providers.bus.publish(
              'refund.initiated',
              { invoice_id: invoices[0]._id, user_id: invoices[0].user._id },
              req.locale
            );
          }
        }
      };
    }
}



export const processRefunds = (refundData: IProcessRefundService) => {

        
};

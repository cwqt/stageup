import { IBulkRefund } from '@core/interfaces';

export interface IProcessRefund {
  host_id: string;
  invoice_ids: string[];
  bulk_refund_data: IBulkRefund;
  send_inititaion_emails: boolean;
}

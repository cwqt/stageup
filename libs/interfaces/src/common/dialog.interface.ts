import { DtoPerformance } from '../performances/performance.interface';
import { DtoInvoice } from './invoice.interface';

export interface IReasonSubmitDialog {
  reason_label: string;
  reasons: Map<string, string>;
  further_info: string;
  further_info_label: string;
  callback: () => {};
}

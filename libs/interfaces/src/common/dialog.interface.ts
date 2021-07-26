import { DtoPerformance } from '../performances/performance.interface';
import { DtoInvoice } from './invoice.interface';

export interface ISelectReasonData {
  reason_label: string;
  reasons: string[];
  further_info?: string;
  further_info_label?: string;
}

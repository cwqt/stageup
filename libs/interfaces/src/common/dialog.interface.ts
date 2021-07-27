import { DtoPerformance } from '../performances/performance.interface';
import { DtoInvoice } from './invoice.interface';
import { IUiDialogOptions } from '../../../../apps/frontend/src/app/ui-lib/ui-lib.interfaces';

export interface ISelectReasonData {
  reason_label: string;
  reasons: string[];
  buttons: IUiDialogOptions['buttons'];
  confirm_button_label: string;
  further_info?: string;
  further_info_label?: string;
}

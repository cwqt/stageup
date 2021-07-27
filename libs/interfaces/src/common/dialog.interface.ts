import { DtoPerformance } from '../performances/performance.interface';
import { DtoInvoice } from './invoice.interface';
import { IUiDialogOptions } from '../../../../apps/frontend/src/app/ui-lib/ui-lib.interfaces';
import { Primitive } from './fp.interface';
import { FormGroup } from '@angular/forms';

export type UiFieldMap<T extends Primitive> = Map<T, { label: string; disabled?: boolean }>;
export interface ISelectReasonData<T extends Primitive> {
  dialog_title: string;
  reasons: UiFieldMap<T>;
  // confirm_button_label: string;
  further_info?: string;
  further_info_label?: string;
  hide_further_info: (currentSelection: T) => boolean;
}

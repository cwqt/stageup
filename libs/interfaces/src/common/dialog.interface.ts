import { Primitive } from './fp.interface';

export type UiFieldMap<T extends Primitive> = Map<T, { label: string; disabled?: boolean }>;
export interface ISelectReasonData<T extends Primitive> {
  dialog_title: string;
  reasons: UiFieldMap<T>;
  placeholder?: string;
  further_info?: string;
  hide_further_info: (currentSelection: T) => boolean;
}

import { SelectionModel } from '@angular/cdk/collections';
import { FilterCode, IEnvelopedData, IHostOnboarding, IUser, IUserStub, Primitive } from '@core/interfaces';
import { IQueryParams } from '@core/helpers';
import { ChipComponent } from '../chip/chip.component';
import { ThemeKind } from '../ui-lib.interfaces';

export interface IUiTable<Input = any, Transformed = Input> {
  title?: string;
  rows?: Transformed[];
  columns: { [index in keyof Input]?: IUiTableColumn<Input> };
  actions: Array<IUiTableAction<Input>>;
  resolver: (query: IQueryParams) => Promise<IEnvelopedData<Input[]>>;
  transformer?: (row: Input) => Transformed;
  selection?: {
    multi: boolean;
    actions: Array<IUiTableAction<SelectionModel<IUiTransformedRowMeta<Input>>>>;
    footer_message?: (selection: SelectionModel<IUiTransformedRowMeta<Input>>) => { label: string; value: Primitive };
  };
  pagination: {
    initial_page?: number;
    initial_page_size?: number;
    page_sizes?: number[];
    show_first_last?: boolean;
  };
}

export interface IUiTableColumn<K> {
  label: string;
  image?: string;
  sort?: IUITableColumnSort;
  filter?: IUiTableColumnFilter;
  chip_selector?: (v: K) => ChipComponent['kind'];
  transformer?: (v: K) => Primitive;
  click_handler?: (v: K) => void;
}

export interface IUiTableColumnFilter {
  type: FilterCode;
  field: string;
  enum?: Map<any, { label: string }>;
}

export interface IUITableColumnSort {
  field: string;
}

export interface IUiTableAction<K> {
  type?: 'button' | 'popover';
  label?: string;
  click: (v: K) => void;
  kind?: ThemeKind;
  icon?: string;
  dropdown?: Array<{
    icon?: string;
    label: string;
    kind?: ThemeKind;
    click: (v: K) => void;
  }>;
}

export type IUiTransformedRowMeta<Input> = {
  __idx: number;
  __data: Input;
  [index: string]: any;
};

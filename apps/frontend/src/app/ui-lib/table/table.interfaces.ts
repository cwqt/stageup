import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { SelectionModel } from '@angular/cdk/collections';
import {
  DottedPaths,
  FilterCode,
  IEnvelopedData,
  IHostOnboarding,
  IUser,
  IUserStub,
  Primitive
} from '@core/interfaces';
import { IQueryParams } from '@core/helpers';
import { ChipComponent } from '../chip/chip.component';
import { ThemeKind } from '../ui-lib.interfaces';

export interface IUiTable<Input = any, Transformed = Input> {
  title?: string;
  rows?: Transformed[];
  columns: Array<IUiTableColumn<Input>>;
  actions: Array<IUiTableAction<Input>>;
  resolver: (query: IQueryParams) => Promise<IEnvelopedData<Input[]>>;
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
    hide_page_size?: boolean;
  };
  clickable?: {
    shadow?: boolean;
    click_function: (v: any) => void; // TODO: sort out type
  };
  uniform_row_height?: boolean; // if true, the height will be set to 65px (helping to maintain consistency if multiple tables)
}

export interface IUiTableColumn<K> {
  label: string;
  accessor: (v: K) => Primitive; // how to display the column data
  image?: (v: K) => Primitive;
  sort?: IUITableColumnSort;
  filter?: IUiTableColumnFilter;
  chip_selector?: (v: K) => ChipComponent['kind'];
  click_handler?: (v: K) => void;
}

export interface IUiTableColumnFilter {
  type: FilterCode;
  field: string; // key to use in query param, ?filter[field]=...
  enum?: Map<any, { label: string }>;
}

export interface IUITableColumnSort {
  field: string;
}

export interface IUiTableAction<K> {
  type?: 'button' | 'popover' | 'toggle';
  label?: string;
  click?: (v: K) => void;
  kind?: ThemeKind;
  icon?: string;
  disabled?: (v: K) => boolean;
  hidden?: (v: K) => boolean; // same as disabled, but the button is removed completely
  dropdown?: Array<{
    icon?: string;
    label: string;
    kind?: ThemeKind;
    click: (v: K) => void;
  }>;
  toggle?: {
    after_label: string; // required primary label (to the right of the toggle)
    before_label?: string; // Optional additional label (when toggle in off position)
    initial_value: (v: K) => boolean;
    event: (e: MatSlideToggleChange, v: K) => void;
  };
}

export type IUiTransformedRowMeta<Input> = {
  __idx: number;
  __data: Input;
  [index: string]: any;
};

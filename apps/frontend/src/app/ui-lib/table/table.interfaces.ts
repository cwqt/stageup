import { SelectionModel } from '@angular/cdk/collections';
import { FilterCode, IEnvelopedData, Primitive } from '@core/interfaces';
import { IQueryParams } from '@core/shared/helpers';
import { ChipComponent } from '../chip/chip.component';
import { ThemeKind } from '../ui-lib.interfaces';

export interface IUiTable<T = any, K = T> {
  title?: string;
  rows?: K[];
  columns: { [index in keyof T]?: IUiTableColumn<T> };
  actions: Array<IUiTableAction<K>>;
  resolver: (query: IQueryParams) => Promise<IEnvelopedData<T[]>>;
  transformer?: (row: T) => K;
  selection?: {
    multi: boolean;
    actions: Array<IUiTableAction<SelectionModel<T>>>;
		footer_message?: (selection:SelectionModel<T>) => { label: string, value: Primitive }
  };
  pagination: {
    page_sizes?: number[];
    initial_page?: number;
    initial_page_size?: number;
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
}

export interface IUiTableColumnFilter {
  type: FilterCode;
  field: string;

  enum?:Map<any, { label: string }>
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

/**
FUNCTIONAL REQUIREMENTS
Column Types
 [x] In a table, the left-most column for tick-boxes (one per each row, and one “select all” tick-box at the top)
 [x] In a table, a user should be able to set the values of one (or more) column’s rows to be
    “clickable” to open a dialogue

 [x] In a table, a user should be able to set the values of one (or more) column’s
    rows to show a static value (ints, strings, dates...)

Actions
 [x] Above a table, there should be an “Actions” dropdown
 [x] Drop down should display a set of functions associated with that table.
 [x] Drop down functions should be applied to which ever (one to many) rows are “ticked”.
 [] Drop down functions may have to change depending on if one or many rows are selected.
    e.g. “Refund Order” vs “Refund Orders”

Filtering
 [x] In a table, you should be able to do a keyword search to filter which rows are
    displayed by the values in that column

Sorting
 [x] In a table, a user should be able to click a column heading to sort all rows by that column.
    Clicking the column again should reverse the sort.

UI
 [x] Whenever a update to the rows is pending, the table just be overlaid with a loading graphic (edited) 
*/

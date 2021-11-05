import { SelectionModel } from '@angular/cdk/collections';
import { EventEmitter } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { SortDirection } from '@core/api';
import { IQueryParams } from '@core/helpers';
import { FilterQuery, IEnvelopedData } from '@core/interfaces';
import { createICacheable, ICacheable } from '@frontend/app.interfaces';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { IUiTable, IUiTableSortDirection, IUiTransformedRowMeta } from './table.interfaces';

export class UiTable<Input = any, Transformed = any> {
  private $loading: BehaviorSubject<boolean>;
  private filterChange: EventEmitter<{ action: 'add' | 'remove' | 'update'; column: string }> = new EventEmitter();
  private refresher: EventEmitter<void> = new EventEmitter();

  // Public to templates
  _dataSource: MatTableDataSource<any>;
  _displayedColumns: string[];
  _footerMessage: ReturnType<IUiTable<Input>['selection']['footer_message']>;
  _activeFilters: { [column: string]: FilterQuery } = {};
  _sortDirection: IUiTableSortDirection;

  ui: {
    table: MatTable<Transformed>;
    sort: MatSort;
    paginator: MatPaginator;
  };

  // Public to all
  public cache: ICacheable<IEnvelopedData<Input[]>>;
  public config: IUiTable<Input, Transformed>;
  public selection: SelectionModel<IUiTransformedRowMeta<Input>>;
  public loading: Observable<boolean>;
  public error: string;

  // Event Handlers for .resolve()
  public resolutionError = new EventEmitter();
  public resolutionSuccess = new EventEmitter<Input[]>();

  constructor(config: IUiTable<Input, Transformed>, cache?: ICacheable<IEnvelopedData<Input[]>>) {
    this.config = config;
    this.cache = cache || createICacheable({ data: [], __paging_data: {}, __client_data: {} });

    this.$loading = new BehaviorSubject(true);
    this.loading = this.$loading.asObservable();

    // Tie the cache to the observable
    this.loading.subscribe(loading => (this.cache.loading = loading));

    // Set up all the columns, selection (if any), custom columns & actions (if any)
    this._displayedColumns = [
      this.config.selection && '__select',
      ...Object.keys(this.config.columns),
      this.config.actions?.length > 0 ? '__actions' : undefined
    ].filter(v => v !== undefined);

    // Set up selection model, if provided
    if (this.config.selection) {
      this.selection = new SelectionModel<IUiTransformedRowMeta<Input>>(this.config.selection.multi, []);
      if (this.config.selection.footer_message)
        this._footerMessage = this.config.selection.footer_message(this.selection);
    }

    // Set up pagination, if provided
    if (this.config.pagination) {
      this.config.pagination.page_sizes = this.config.pagination.page_sizes || [10, 25, 50];
    }

    this._dataSource = new MatTableDataSource([]);
  }

  // re-evaluate current state & refresh data from resolver
  refresh() {
    this.refresher.emit();
  }

  async resolve(query: IQueryParams) {
    this.$loading.next(true);
    try {
      const data = await this.config.resolver(query);
      this.cache.data = data;
      this.resolutionSuccess.emit(data.data);
      return data;
    } catch (error) {
      this.error = error;
      this.cache.error = error;
      this.resolutionError.emit(error);
      throw error;
    } finally {
      this.$loading.next(false);
    }
  }

  /**
   * @description UiTable component should call this, populating all @ViewChild attributes
   */
  _setup(table: MatTable<Transformed>, paginator: MatPaginator, sort: MatSort) {
    this.ui = {
      table,
      paginator,
      sort
    };

    // Setup data sources & initial state
    this.$loading.next(true);

    // Listen for all these events, refreshing the data as needed
    merge(this.ui.sort.sortChange, this.ui.paginator.page, this.filterChange, this.refresher)
      .pipe(startWith({})) // make the initial request
      .subscribe(async () => {
        // Setup the query options with pagination...
        const query: IQueryParams = {
          page: this.ui.paginator?.pageIndex ?? 0,
          per_page: this.ui.paginator?.pageSize ?? 10
        };

        // Set the sort...
        if (this.ui.sort.active) {
          // Choose the aliased name, if any, else the actual column index name
          // my_column: { sort: { field: "aliased_name" }}
          const field = this.config.columns[this.ui.sort.active].sort.field || this.ui.sort.active;

          query.sort = {
            [field]: this.ui.sort.direction.toLocaleUpperCase() as SortDirection
          };
          this._sortDirection = this.ui.sort.direction.toLocaleUpperCase() as IUiTableSortDirection;
        }

        // And then all the active filters...
        if (Object.keys(this._activeFilters).length) {
          // Map filter names to aliased one, if any
          query.filter = Object.keys(this._activeFilters).reduce((acc, curr) => {
            this.config.columns[curr].filter.field
              ? (acc[this.config.columns[curr].filter.field] = this._activeFilters[curr])
              : (acc[curr] = this._activeFilters[curr]);

            return acc;
          }, {});
        }

        // And resolve!
        try {
          const envelope = await this.resolve(query);
          const transformed = this.transform(envelope.data);
          this._dataSource.data = transformed;
        } catch (error) {
          console.log('Error occured fetching data');
          console.error(error);
        }
      });
  }

  private transform(data: Input[]) {
    const rows = [];
    for (const [idx, row] of (data || []).entries()) {
      const rowData = { __data: row, __idx: idx };
      for (const column of Object.keys(this.config.columns)) {
        rowData[column] = this.config.columns[column].accessor(row);
      }

      rows.push(rowData);
    }

    return rows;
  }

  setFilter(column: string, filter: FilterQuery | null) {
    console.log('Added filter: ', column, filter);

    this._activeFilters[column] = filter;
    if (filter == null) delete this._activeFilters[column];

    this.filterChange.emit();
  }

  // Whether the number of selected elements matches the total number of rows
  areAllRowsSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this._dataSource.data.length;
    return numSelected === numRows;
  }

  // Selects all rows if they are not all selected; otherwise clear selection
  toggleAllRowsSelection() {
    this.areAllRowsSelected()
      ? this.selection.clear()
      : this._dataSource.data.forEach(row => this.selection.select(row));
    if (this.config.selection.footer_message)
      this._footerMessage = this.config.selection.footer_message(this.selection);
  }

  selectRow(row) {
    this.selection.toggle(row);
    if (this.config.selection.footer_message)
      this._footerMessage = this.config.selection.footer_message(this.selection);
  }

  get(rowIdx: number): Input {
    return this._dataSource.data[rowIdx];
  }

  update(row: Input, newRow: Input) {
    this._dataSource.data.splice(
      this._dataSource.data.findIndex(r => r == row),
      1,
      this.transform([newRow]).pop()
    );

    this.ui.table.renderRows();
  }

  add(row: Input) {
    this._dataSource.data.unshift(this.transform([row]).pop());
    this.cache.data.__paging_data.total += 1;
    this.ui.table.renderRows();
  }

  remove(row: Input) {
    this._dataSource.data.splice(
      this._dataSource.data.findIndex(r => r == row),
      1
    );
    this.cache.data.__paging_data.total -= 1;
    this.ui.table.renderRows();
  }

}

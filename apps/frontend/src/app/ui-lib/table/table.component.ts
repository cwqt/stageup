import { PopperContent } from 'ngx-popper';
import { BehaviorSubject, from, merge, Observable, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { SelectionModel } from '@angular/cdk/collections';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { FilterQuery, IEnvelopedData, IHostInvoice } from '@core/interfaces';
import { SortDirection } from '@core/api';
import { IQueryParams } from '@core/helpers';

import { cachize, ICacheable } from '../../app.interfaces';
import { IUiTable } from './table.interfaces';

@Component({
  selector: 'ui-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T> implements OnInit, AfterViewInit {
  @Input() table: IUiTable<T>;
  @Input() cacheable: ICacheable<IEnvelopedData<T[]>>;

  private filterChange: EventEmitter<void> = new EventEmitter();

  @ViewChild(MatTable) tableRef: MatTable<T>;
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChildren(PopperContent) poppers: QueryList<PopperContent>;

  footerMessage: ReturnType<IUiTable<T>['selection']['footer_message']>;
  subject: BehaviorSubject<any>;
  dataSource: Observable<any[]> = of([]);
  displayedColumns: string[];
  selection: SelectionModel<T>;
  activeFilters: { [column: string]: FilterQuery } = {};

  constructor() {}

  async ngOnInit() {
    this.cacheable.loading = true; // prevent ExpressionChangedAfterItHasBeenCheckedError

    // Set up all the columns, selection (if any), custom columns & actions (if any)
    this.displayedColumns = [
      this.table.selection && '__select',
      ...Object.keys(this.table.columns),
      this.table.actions?.length > 0 ? '__actions' : undefined
    ].filter(v => v !== undefined);

    // Set up selection model
    if (this.table.selection) {
      this.selection = new SelectionModel<T>(this.table.selection.multi, []);
      if (this.table.selection.footer_message) this.footerMessage = this.table.selection.footer_message(this.selection);
    }
  }

  ngAfterViewInit() {
    if (this.table.pagination) {
      this.table.pagination.page_sizes = this.table.pagination.page_sizes || [10, 25, 50];
    }

    this.subject = new BehaviorSubject([]); // sorts the data source at some point in time

    this.dataSource = merge(this.sort.sortChange, this.paginator.page, this.filterChange).pipe(
      startWith({}),
      switchMap(() => {
        this.selection?.clear();
        this.subject.next([]);

        // create base params for the filter
        const resolverData: IQueryParams = {
          page: this.paginator.pageIndex ?? 0,
          per_page: this.paginator.pageSize ?? 10
        };

        // add the sort & direction
        if (this.sort.active) {
          resolverData.sort = {
            [this.table.columns[this.sort.active].sort.field ||
            this.sort.active]: this.sort.direction.toLocaleUpperCase() as SortDirection
          };
        }

        // ...and the filters
        if (Object.keys(this.activeFilters).length) {
          // map the filters over to the fieldname for api consumption
          resolverData.filter = Object.keys(this.activeFilters).reduce((acc, curr) => {
            this.table.columns[curr].filter.field
              ? (acc[this.table.columns[curr].filter.field] = this.activeFilters[curr])
              : (acc[curr] = this.activeFilters[curr]);

            return acc;
          }, {});
        }

        return from(cachize(this.table.resolver(resolverData), this.cacheable));
      }),
      map(data => {
        this.subject.next(this.transform(data));
        return this.subject.getValue();
      }),
      catchError(() => of([]))
    );
  }

  private transform(data: IEnvelopedData<T[]>) {
    const rows = [];
    for (const [idx, row] of (data.data || []).entries()) {
      const rowData = { __data: row, __idx: idx };
      for (const column of Object.keys(this.table.columns)) {
        const colData = this.table.columns[column as keyof T];
        rowData[column] = colData.transformer ? colData.transformer(row) : row[column];
      }

      rows.push(rowData);
    }

    return rows;
  }

  resetPaging() {
    this.selection?.clear();
  }

  // Whether the number of selected elements matches the total number of rows
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.subject.getValue().length;
    return numSelected === numRows;
  }

  // Selects all rows if they are not all selected; otherwise clear selection
  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.subject.getValue().forEach(row => this.selection.select(row));
    if (this.table.selection.footer_message) this.footerMessage = this.table.selection.footer_message(this.selection);
  }

  public remove(row) {}

  public add(row) {}

  addFilter(column: string, filter: FilterQuery | null) {
    console.log(' filter ', column, filter);

    this.activeFilters[column] = filter;
    if (filter == null) delete this.activeFilters[column];

    this.filterChange.emit();
    this.closePoppers();
  }

  openFilterPopover(event: MouseEvent, column) {
    event.stopPropagation();
    this.closePoppers();
  }

  selectRow(row) {
    this.selection.toggle(row);
    if (this.table.selection.footer_message) this.footerMessage = this.table.selection.footer_message(this.selection);
  }

  closePoppers() {
    this.poppers.forEach(popper => {
      if (popper.ariaHidden == 'false') popper.hide();
    });
  }
}

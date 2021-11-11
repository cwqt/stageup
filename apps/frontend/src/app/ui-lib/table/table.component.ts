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
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { FilterQuery } from '@core/interfaces';

import { UiTable } from './table.class';

@Component({
  selector: 'ui-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T> implements OnInit, AfterViewInit {
  @Input() table: UiTable<T>;
  @Input() lastUpdated: number;

  @ViewChild(MatTable) tableRef: MatTable<T>;
  @ViewChild(MatPaginator) paginatorRef?: MatPaginator;
  @ViewChild(MatSort) sortRef: MatSort;
  @ViewChildren(PopperContent) poppers: QueryList<PopperContent>;

  constructor() { }

  async ngOnInit() { }

  async ngAfterViewInit() {
    if (this.paginatorRef) {
      const intl = new MatPaginatorIntl();
      /** A label for the page size selector. */
      intl.itemsPerPageLabel = $localize`:@@table_items_per_page:Items per page:`;

      /** A label for the button that increments the current page. */
      intl.nextPageLabel = $localize`:@@table_next_page:Next page`;

      /** A label for the button that decrements the current page. */
      intl.previousPageLabel = $localize`:@@table_previous_page:Previous page`;

      /** A label for the button that moves to the first page. */
      intl.firstPageLabel = $localize`:@@table_first_page:First page`;

      /** A label for the button that moves to the last page. */
      intl.lastPageLabel = $localize`:@@table_last_page:Last page`;

      /** A label for the range of items within the current page and the length of the whole list. */
      intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
        if (length == 0 || pageSize == 0) return $localize`:@@table_range_zero:0 of ${length}`;

        length = Math.max(length, 0);
        const startIndex = page * pageSize;

        // If the start index exceeds the list length, do not try and fix the end index to the end.
        const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
        return $localize`:@@table_range_range:${startIndex + 1} - ${endIndex} of ${length}`;
      };

      this.paginatorRef._intl = intl;
    }

    this.table._setup(this.tableRef, this.paginatorRef, this.sortRef);
  }

  resetPaging() {
    this.table.selection?.clear();
  }

  setFilter(column: string, filter: FilterQuery | null) {
    this.table.setFilter(column, filter);
    this.closeAllPoppers();
  }

  openFilterPopover(event: MouseEvent) {
    event.stopPropagation();
    this.closeAllPoppers();
  }

  closeAllPoppers() {
    this.poppers.forEach(popper => {
      if (popper.ariaHidden == 'false') popper.hide();
    });
  }
}

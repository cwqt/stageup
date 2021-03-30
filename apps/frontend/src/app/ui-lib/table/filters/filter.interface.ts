import { EventEmitter } from "@angular/core";
import { FilterQuery } from "@core/interfaces";
export interface IUITableFilter {
  active: string;
  onChange:EventEmitter<FilterQuery | null>
}
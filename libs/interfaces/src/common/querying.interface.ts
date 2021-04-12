import { Primitive } from './fp.interface';

export enum FilterCode {
  String = 'STR',
  Number = 'NUM',
  Enum = 'ENUM',
  Date = 'DATE',
  Boolean = 'BOOL'
}
export type FilterQuery<T extends FilterCode = any, K extends Operators = any, V extends Primitive[] = any> = [
  T,
  K,
  ...V
];

export type Operators =
  | StringFilterOperator
  | EnumFilterOperator
  | NumberFilterOperator
  | BooleanFilterOperator
  | DateFilterOperator;

/**
 * ?filter[column]=type,opcode,...args
 * {
 * 	filter: {
 * 		column: ["STR", "eq", "search value"]
 * 	}
 * }
 */

// STR ----------------------------------------------------------------------------------
export enum StringFilterOperator {
  Equals = 'eq',
  DoesNotEqual = 'neq',
  BeginsWith = 'bw',
  DoesNotBeginWith = 'nbw',
  EndsWith = 'ew',
  DoesNotEndWith = 'new',
  Contains = 'inc',
  DoesNotContain = 'ninc'
}

export type StringFilter = FilterQuery<FilterCode.String, StringFilterOperator, [string]>;

// ENUM ---------------------------------------------------------------------------------
// Enum is just an array of matches, args ∈ E || args ∉ E
export enum EnumFilterOperator {
  Contains = 'inc'
}

export type EnumFilter = FilterQuery<FilterCode.Enum, EnumFilterOperator, Primitive[]>;

// INT ----------------------------------------------------------------------------------
export enum NumberFilterOperator {
  Equals = 'eq',
  DoesNotEqual = 'neq',
  GreaterThan = 'gt',
  GreaterThanOrEqual = 'gte',
  LessThan = 'lt',
  LessThanOrEqual = 'lte',
  Between = 'btw'
}

export type NumberFilter = FilterQuery<FilterCode.Number, NumberFilterOperator, [number, number?]>;

// BOOL ---------------------------------------------------------------------------------
export enum BooleanFilterOperator {
  isTrue = 'true',
  isFalse = 'false'
}

export type BooleanFilter = FilterQuery<FilterCode.Boolean, BooleanFilterOperator, [boolean]>;

// DATE ---------------------------------------------------------------------------------
export enum DateFilterOperator {
  Equals = 'eq',
  Before = 'lt',
  After = 'gt',
  Between = 'btw'
}

// where args are UNIX timestamps
export type DateFilter = FilterQuery<FilterCode.Date, DateFilterOperator, [number, number?]>;

// TODO: All these other options can be done by just adding time onto the args to get the desired offset
// Tomorrow
// Today
// Yesterday
// Next Week
// Last Week
// Next Month
// This Month
// Last Month
// Next Quarter
// This Quarter
// Last Quarter
// Next Year
// This Year
// Last Year

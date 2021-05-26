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

export const Filters = {
  [FilterCode.String]: (operator: StringFilterOperator, value: string): StringFilter => [
    FilterCode.String,
    operator,
    value
  ],
  [FilterCode.Number]: (operator: NumberFilterOperator, value: number): NumberFilter => [
    FilterCode.Number,
    operator,
    value
  ],
  [FilterCode.Enum]: (operator: EnumFilterOperator, ...args: any[]): EnumFilter => [FilterCode.Enum, operator, ...args],
  [FilterCode.Date]: (operator: DateFilterOperator, ...args: number[]): DateFilter => [
    FilterCode.Date,
    operator,
    args[0],
    args[1]
  ],
  [FilterCode.Boolean]: (operator: BooleanFilterOperator, value: boolean): BooleanFilter => [
    FilterCode.Boolean,
    operator,
    value
  ]
} as const;

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

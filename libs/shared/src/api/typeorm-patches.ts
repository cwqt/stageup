import {
  BooleanFilter,
  BooleanFilterOperator,
  DateFilter,
  DateFilterOperator,
  EnumFilter,
  EnumFilterOperator,
  FilterCode,
  FilterQuery,
  IEnvelopedData,
  NumberFilter,
  NumberFilterOperator,
  NUUID,
  PaginationOptions,
  Primitive,
  StringFilter,
  StringFilterOperator
} from '@core/interfaces';
import { timeless, timestamp, to } from '@core/helpers';
import { NextFunction, Request, Response } from 'express';
import { SelectQueryBuilder } from 'typeorm';

export type EntitySerialiser<T, K> = (e: T) => K;
export type SortDirection = 'ASC' | 'DESC';

declare module 'typeorm' {
  export interface SelectQueryBuilder<Entity> {
    filter(map: FilterMap): SelectQueryBuilder<Entity>;
    sort(map: Record<string, string>): SelectQueryBuilder<Entity>;

    // Modified from https://github.com/savannabits/typeorm-pagination
    paginate(): Promise<IEnvelopedData<Entity[], null>>;
    paginate<K>(
      serialiser: EntitySerialiser<Entity, K>,
      paging?: PaginationOptions
    ): Promise<IEnvelopedData<K[], null>>;
  }
}

/**
 * @description Create a middleware which patches into SelectQueryBuilder prototype
 */
export const patchTypeORM = (req: Request, res: Response, next: NextFunction) => {
  // Use function instead of => to have this reference in queryBuilder chain
  SelectQueryBuilder.prototype.paginate = async function <T, K>(
    serialiser?: EntitySerialiser<T, K>,
    paging?: PaginationOptions
  ): Promise<IEnvelopedData<T[] | K[], null>> {
    const page = paging?.page ?? (parseInt(req.query.page as string) || 0);
    const perPage = paging?.per_page ?? (parseInt(req.query.per_page as string) || 10);

    return paginate<T, K>(this, page, perPage, serialiser);
  };

  SelectQueryBuilder.prototype.filter = function <T>(fm: FilterMap): SelectQueryBuilder<T> {
    return filter(this, (req.query?.filter || {}) as { [index: string]: any }, fm);
  };

  SelectQueryBuilder.prototype.sort = function <T>(sm: Record<string, string>): SelectQueryBuilder<T> {
    return sort(this, (req.query?.sort || {}) as { [index: string]: any }, sm);
  };

  next();
};

export const sort = <T>(
  builder: SelectQueryBuilder<T>,
  query: { [index: string]: Primitive | Primitive[] },
  sm: Record<string, string>
): SelectQueryBuilder<T> => {
  const sorts = Object.entries(sm).filter(s => query[s[0]] !== undefined);
  if (sorts.length > 1) throw Error(`Too many sorts`);
  if (sorts.length == 0) return builder;

  const [key, sql] = sorts[0];
  return builder.orderBy(sql, query[key] as SortDirection);
};

export type FilterMap = Record<string, FilterOptions>;

export type FilterOptions = {
  subject: string;
  transformer?: (value: Primitive) => string | number | boolean;
};

type Whereable<T> = SelectQueryBuilder<T>['where'] | SelectQueryBuilder<T>['andWhere'];
type WhereOp<T, K extends FilterQuery[2]> = (v: {
  sub: string;
  opts: FilterOptions;
  args: K;
  refs: NUUID[]; // transformed ref values
}) => [Parameters<Whereable<T>>[0], { [index: string]: Primitive }?];

// prettier-ignore
const OperatorResolver:{[index in FilterCode]} = {
	[FilterCode.String]: to<{[index in StringFilterOperator]: WhereOp<any, StringFilter[2]>}>({
		[StringFilterOperator.Equals]: 						v => [`LOWER(${v.sub}) = LOWER(:${v.refs[0]})`], // simple equality
		[StringFilterOperator.DoesNotEqual]: 			v => [`LOWER(${v.sub}) != LOWER(:${v.refs[0]})`], // simple equality
		[StringFilterOperator.BeginsWith]: 				v => [`${v.sub} ILIKE :${v.refs[0]}`, 	  { [v.refs[0]]: `${v.args[0]}%`}],  // wildcard after
		[StringFilterOperator.DoesNotBeginWith]: 	v => [`${v.sub} NOT ILIKE :${v.refs[0]}`, { [v.refs[0]]: `${v.args[0]}%`}],  // not wildcard after
		[StringFilterOperator.EndsWith]: 					v => [`${v.sub} ILIKE :${v.refs[0]}`, 	  { [v.refs[0]]: `%${v.args[0]}`}],  // wildcard before
		[StringFilterOperator.DoesNotEndWith]: 		v => [`${v.sub} NOT ILIKE :${v.refs[0]}`, { [v.refs[0]]: `%${v.args[0]}`}],  // not wildcard before
		[StringFilterOperator.Contains]: 					v => [`${v.sub} ILIKE :${v.refs[0]}`, 	  { [v.refs[0]]: `%${v.args[0]}%`}], // wildcard both sides
		[StringFilterOperator.DoesNotContain]: 		v => [`${v.sub} NOT ILIKE :${v.refs[0]}`, { [v.refs[0]]: `%${v.args[0]}%`}]  // not wildcard both sides
	}),
	[FilterCode.Enum]: to<{[index in EnumFilterOperator]: WhereOp<any, EnumFilter[2]>}>({
		[EnumFilterOperator.Contains]: 						v => [`${v.sub} IN (:...${v.refs[0]})`, { [v.refs[0]]: v.args }] // 1st arg is all args
	}),
	[FilterCode.Date]: to<{[index in DateFilterOperator]: WhereOp<any, DateFilter[2]>}>({
		[DateFilterOperator.Equals]: 							v => [`${v.sub} = :${v.refs[0]}`, { [v.refs[0]]: timestamp(timeless(new Date(v.args[0] * 1000)))}],
		[DateFilterOperator.After]: 							v => [`${v.sub} > :${v.refs[0]}`, { [v.refs[0]]: timestamp(timeless(new Date(v.args[0] * 1000)))}],
		[DateFilterOperator.Before]: 							v => [`${v.sub} < :${v.refs[0]}`, { [v.refs[0]]: timestamp(timeless(new Date(v.args[0] * 1000)))}],
		[DateFilterOperator.Between]: 						v => [`${v.sub} BETWEEN :${v.refs[0]} AND :${v.refs[1]}`],
	}),
	[FilterCode.Boolean]: to<{[index in BooleanFilterOperator]: WhereOp<any, BooleanFilter[2]>}>({
		[BooleanFilterOperator.isTrue]:						v => [`${v.sub} IS TRUE`],
		[BooleanFilterOperator.isFalse]:					v => [`${v.sub} IS NOT TRUE`]
	}),
	[FilterCode.Number]: to<{[index in NumberFilterOperator]: WhereOp<any, NumberFilter[2]>}>({
		[NumberFilterOperator.Equals]: 						 v => [`${v.sub} = :${v.refs[0]}`],
		[NumberFilterOperator.DoesNotEqual]: 			 v => [`${v.sub} != :${v.refs[0]}`],
		[NumberFilterOperator.GreaterThan]: 			 v => [`${v.sub} > :${v.refs[0]}`],
		[NumberFilterOperator.GreaterThanOrEqual]: v => [`${v.sub} >= :${v.refs[0]}`],
		[NumberFilterOperator.LessThan]: 					 v => [`${v.sub} < :${v.refs[0]}`],
		[NumberFilterOperator.LessThanOrEqual]: 	 v => [`${v.sub} <= :${v.refs[0]}`],
		[NumberFilterOperator.Between]: 					 v => [`${v.sub} BETWEEN :${v.refs[0]} AND :${v.refs[1]}`],
	}),
} as const;

export const filter = <T>(
  builder: SelectQueryBuilder<T>,
  query: { [index: string]: Primitive | Primitive[] },
  fm: FilterMap
): SelectQueryBuilder<T> => {
  // For each possible filter in the filter map, tack on the where / addWhere
  // to narrow the search onto the query builder
  Object.entries(fm)
    .filter(([field, _]) => query[field] !== undefined)
    .forEach(([field, options]: [string, FilterOptions], fIdx) => {
      let [type, opcode, ...args] = query[field] as any;

      // Check valid operation
      if (![FilterCode.String, FilterCode.Number, FilterCode.Enum, FilterCode.Date, FilterCode.Boolean].includes(type))
        throw Error(`${type} not implemented`);

      // Get the right whereable for the position in the qb chain
      const where = fIdx == 0 ? builder.where.bind(builder) : builder.andWhere.bind(builder);

      // Transform data according to provided option
      args = args.map(options?.transformer || ((v: Primitive) => v));

      // Map to a parameter, to avoid SQL injections
      const refs = args.reduce(
        // Create a safe reference of the form: filterIndex operatorIndex
        (acc: { [index: string]: Primitive }, arg: Primitive, opIdx) => ((acc[`f${fIdx}op${opIdx}`] = arg), acc),
        {}
      );

      const [sql, transformedRefs] = OperatorResolver[type][opcode as StringFilterOperator]({
        sub: options.subject, // subject of the query, host.username etc
        opts: options, // options on manipulating the query
        args, // operands
        refs: Object.keys(refs) // qb parameter key reference
      });

      // Map arg to formatted version, for final placement in TypeORM parameter object
      if (transformedRefs) Object.keys(transformedRefs).forEach(ref => (refs[ref] = transformedRefs[ref]));

      builder = where(sql, refs);
    });

  return builder;
};

export const paginate = async <T, K>(
  builder: SelectQueryBuilder<T>,
  page: number,
  perPage: number,
  serialiser?: EntitySerialiser<T, K>
): Promise<IEnvelopedData<K[] | T[], null>> => {
  const skip = page * perPage;
  const count = await builder.getCount();
  const res = (await builder.skip(skip).take(perPage).getMany()) as T[];

  return {
    data: serialiser ? res.map(e => serialiser(e)) : res,
    __client_data: null,
    __paging_data: {
      per_page: perPage,
      total: count,
      current_page: page,
      prev_page: page >= 1 ? page - 1 : null,
      next_page: count >= skip + perPage ? page + 1 : null
    }
  };
};

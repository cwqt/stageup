import { NextFunction, Response, Request } from 'express';

import { SelectQueryBuilder } from 'typeorm';
import { IEnvelopedData } from '@core/interfaces';

// Modified from
// https://github.com/savannabits/typeorm-pagination
declare module 'typeorm' {
  export interface SelectQueryBuilder<Entity> {
    paginate(per_page?: number | null): Promise<IEnvelopedData<Entity[], null>>;
  }
}

/**
 * Boot the package by patching the SelectQueryBuilder
 */
export const pagination = (request: Request, res: Response, next: NextFunction) => {
  // Use function instead of => to have this reference in queryBuilder chain
  SelectQueryBuilder.prototype.paginate = async function <T>(
    per_page?: number | null
  ): Promise<IEnvelopedData<T[], null>> {
    // FIXME: not sure why this returns [Object: null prototype], but coercing it back and forth gives us an object
    const locals = JSON.parse(JSON.stringify(res.locals));
    const current_page = locals.page === 0 ? 1 : locals.page;
    per_page = per_page || locals.per_page;

    return paginate(this, current_page, per_page);
  };

  next();
};

const paginate = async <T>(
  builder: SelectQueryBuilder<any>,
  page: number,
  per_page: number
): Promise<IEnvelopedData<T[], null>> => {
  const skip = (page - 1) * per_page;
  const total = builder;
  const count = await total.getCount();
  const res = await builder.skip(skip).take(per_page).getMany();

  return {
    data: res as T[],
    __client_data: null,
    __paging_data: {
      from: skip <= count ? skip + 1 : null,
      to: count > skip + per_page ? skip + per_page : count,
      per_page: per_page,
      total: count,
      current_page: page,
      prev_page: page > 1 ? page - 1 : null,
      next_page: count > skip + per_page ? page + 1 : null
    }
  };
};

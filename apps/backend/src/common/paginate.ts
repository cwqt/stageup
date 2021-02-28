import { NextFunction, Response, Request } from 'express';
import { SelectQueryBuilder } from 'typeorm';
import { IEnvelopedData } from '@core/interfaces';

export type EntitySerialiser<T, K> = (e: T) => K;

// Modified from https://github.com/savannabits/typeorm-pagination
declare module 'typeorm' {
  export interface SelectQueryBuilder<Entity> {
    paginate(): Promise<IEnvelopedData<Entity[], null>>;
    paginate<K>(serialiser: EntitySerialiser<Entity, K>): Promise<IEnvelopedData<K[], null>>;
  }
}

/**
 * @description Create a middleware which patches into SelectQueryBuilder prototype
 */
export const pagination = (req: Request, res: Response, next: NextFunction) => {
  // Use function instead of => to have this reference in queryBuilder chain
  SelectQueryBuilder.prototype.paginate = async function <T, K>(
    serialiser?: EntitySerialiser<T, K>
  ): Promise<IEnvelopedData<T[] | K[], null>> {
    const locals = res.locals;
    const current_page = locals.page === 0 ? 1 : locals.page;

    return paginate<T, K>(
      this,
      current_page,
      locals.per_page,
      serialiser
    );
  };

  next();
};

const paginate = async <T, K>(
  builder: SelectQueryBuilder<T>,
  page: number,
  per_page: number,
  serialiser?: EntitySerialiser<T, K>
): Promise<IEnvelopedData<K[] | T[], null>> => {
  const skip = (page - 1) * per_page;
  const count = await builder.getCount();
  const res = (await builder.skip(skip).take(per_page).getMany()) as T[];

  return {
    data: serialiser ? res.map(e => serialiser(e)) : res,
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

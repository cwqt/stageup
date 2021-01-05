import { NextFunction } from 'express';
import { Response } from 'express';
import { Request } from 'express';
import { paginate } from './helpers/paginator';
import { SelectQueryBuilder } from 'typeorm';
import { IEnvelopedData } from '@eventi/interfaces';

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
export const pagination = (req: Request, res: Response, next: NextFunction) => {
  // use function instead of => to have this reference in queryBuilder chain
  SelectQueryBuilder.prototype.paginate = async function<T>(per_page?: number | null): Promise<IEnvelopedData<T[], null>> {

    //FIXME: not sure why this returns [Object: null prototype], but coercing it back and forth gives us an object
    const locals = JSON.parse(JSON.stringify(res.locals));
    let current_page = locals.page == 0 ? 1 : locals.page;
    per_page = per_page || locals.per_page;

    return await paginate(this, current_page, per_page);
  };

  next();
};

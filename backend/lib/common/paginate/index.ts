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
    let current_page = res.locals.pagination.page;
    per_page = per_page || res.locals.pagination.per_page;

    return await paginate(this, current_page, per_page);
  };

  next();
};

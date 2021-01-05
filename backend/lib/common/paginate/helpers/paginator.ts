import { IEnvelopedData } from '@eventi/interfaces';
import { SelectQueryBuilder } from 'typeorm';

export const paginate = async <T>(
  builder: SelectQueryBuilder<any>,
  page: number,
  per_page: number
): Promise<IEnvelopedData<T[], null>> => {
  const skip = (page - 1) * per_page;
  const total = builder;
  const count = await total.getCount();
  let res = await builder.skip(skip).take(per_page).getMany();
  
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
      next_page: count > skip + per_page ? page + 1 : null,  
    }
  };
};

import { PagingData } from '@eventi/interfaces';
import config from '../config';

export const createPagingData = (endpoint: string, count: number, per_page: number):PagingData => {
  count = count || 0;

  return {
    next: `${config.API_URL}${endpoint}?page=1&per_page=${per_page}`,
    prev: `${config.API_URL}${endpoint}?page=${Math.ceil(count / per_page)}&per_page=${per_page}`,
    total: count,
    pages: Math.ceil(count / per_page),
  };
};

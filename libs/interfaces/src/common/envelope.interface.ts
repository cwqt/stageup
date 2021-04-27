
export interface IEnvelopedData<T, K=null> {
  data: T;
  __client_data?: K;
  __paging_data?: PagingData;
}

export interface PaginationOptions { page: number; per_page: number; }

export interface PagingData {
  per_page: any;
  total: number;
  current_page: number;
  prev_page?: number | null;
  next_page?: number | null;
}

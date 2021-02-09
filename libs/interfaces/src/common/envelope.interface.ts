export interface IEnvelopedData<T, K> {
  data: T;
  __client_data?: K;
  __paging_data?: PagingData;
}

export interface PagingData {
  from: any;
  to: any;
  per_page: any;
  total: number | any;
  current_page: number;
  prev_page?: number | null;
  next_page?: number | null;
}



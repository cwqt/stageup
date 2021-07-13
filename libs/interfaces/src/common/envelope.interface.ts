
export interface IEnvelopedData<T, K=null> {
  data: T;
  __client_data?: K;
  __paging_data?: PagingData;
}
// The url request sends data in string format
export interface PaginationOptions { page: number | string; per_page: number | string; }

export interface PagingData {
  per_page: any;
  total: number;
  current_page: number;
  prev_page?: number | null;
  next_page?: number | null;
}

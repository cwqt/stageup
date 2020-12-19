export interface IEnvelopedData<T, K> {
  data: T;
  __client_data?: K;
  __paging_data?: PagingData;
}

export interface PagingData {
  next: string;
  prev: string;
  total: number;
  pages: number;
}

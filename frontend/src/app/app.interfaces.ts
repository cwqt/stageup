export interface ICacheable<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
  }
  
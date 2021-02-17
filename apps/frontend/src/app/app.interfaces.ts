import { HttpErrorResponse } from '@angular/common/http';
import { ErrCode, Primitive } from '@core/interfaces';

/**
 * @description Wrapper around requests to do common actions when making requests
 * @param promise Promise that returns a HttpResponse<T>
 * @param c cacheable created from createICacheable
 * @example return cachize(this.http.get<IUser[]>(`/api/users`), cacheable);
 */
function cachize<T>(promise: Promise<T>, c: ICacheable<T>): Promise<T>;
function cachize<T, K>(promise: Promise<T>, c: ICacheable<K>, transformer: (d: T) => K): Promise<K>;
function cachize<T, K = T>(promise: Promise<T | K>, c: ICacheable<T | K>, transformer?: (d: T) => K): Promise<T | K> {
  c.loading = true;
  promise = transformer ? promise.then(d => transformer(d as T)) : promise;

  promise
    .then(d => (c.data = d))
    .catch(e => (c.error = e))
    .finally(() => (c.loading = false));

  return promise;
}

export { cachize };

/**
 * @description Wrapper interface for a request being made
 */
export interface ICacheable<T> {
  data?: T;
  error: string | HttpErrorResponse | null;
  loading: boolean;
  form_errors?: FormErrors;
  meta?: { [index: string]: any };
}

export interface FormErrors {
  [index: string]: null | ErrCode | FormErrors;
}

export const createICacheable = <T = any>(
  initialValue?: any,
  meta?: Record<string, Primitive>
): ICacheable<T | null> => {
  return {
    data: initialValue || null,
    loading: false,
    error: '',
    form_errors: {},
    meta: meta || {}
  };
};

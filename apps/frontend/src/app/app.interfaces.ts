import { HttpErrorResponse } from '@angular/common/http';
import { ErrCode } from '@core/interfaces';

/**
 * @description Wrapper around requests to do common actions when making requests
 * @param promise Promise that returns a HttpResponse<T>
 * @param c cacheable created from createICacheable
 * @example return cachize(this.http.get<IUser[]>(`/api/users`), cacheable);
 */
export const cachize = <T>(promise: Promise<T>, c?: ICacheable<T>) => {
  if (c) {
    c.loading = true;

    promise
      .then(d => (c.data = d))
      .catch(e => (c.error = e))
      .finally(() => (c.loading = false));
  }
  return promise;
};

/**
 * @description Wrapper interface for a request being made
 */
export interface ICacheable<T> {
  data?: T | null;
  error: string | HttpErrorResponse | null;
  loading: boolean;
  form_errors?: FormErrors;
  meta?: { [index: string]: any };
}

export interface FormErrors {
  [index: string]: null | ErrCode | FormErrors;
}

export const createICacheable = <T = any>(): ICacheable<T | null> => {
  return {
    data: null,
    loading: false,
    error: '',
    form_errors: {},
    meta: {}
  };
};

import { HttpErrorResponse } from '@angular/common/http';
import { i18nToken, ILocale, Primitive } from '@core/interfaces';
import { BehaviorSubject } from 'rxjs';

//ISO 639-1 - ISO 3166-1 Alpha-2
export const SUPPORTED_LOCALES: ReadonlyArray<ILocale> = [
  { language: 'en', region: 'GB' },
  { language: 'cy', region: 'GB' },
  { language: 'nb', region: 'NO' }
];

/**
 * @description Wrapper around requests to do common actions when making requests
 * @param promise Promise that returns a HttpResponse<T>
 * @param c cacheable created from createICacheable
 * @param transformer Transform returned data before cachize().then()
 * @example return cachize(this.http.get<IUser[]>(`/api/users`), cacheable);
 */
function cachize<T>(promise: Promise<T>, c: ICacheable<T>): Promise<T>;
function cachize<T, K>(
  promise: Promise<T>,
  c: ICacheable<K>,
  transformer: (d: T) => K,
  showLoading?: boolean
): Promise<K>;
function cachize<T, K = T>(
  promise: Promise<T | K>,
  c: ICacheable<T | K>,
  transformer?: (d: T) => K,
  showLoading: boolean = true
): Promise<T | K> {
  if (showLoading) c.loading = true;
  promise = transformer ? promise.then(d => transformer(d as T)) : promise;

  promise.then(d => (c.data = d)).catch(e => (c.error = e));

  if (showLoading) promise.finally(() => (c.loading = false));

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
  form_errors?: { [index: string]: Array<[i18nToken, string]> };
  meta?: { [index: string]: any };
}

export const createICacheable = <T = any>(
  initialValue?: any,
  meta?: Record<string, Primitive>,
  loading: boolean = false
): ICacheable<T | null> => {
  return {
    data: initialValue || null,
    loading: loading,
    error: '',
    form_errors: {},
    meta: meta || {}
  };
};

/**
 * @description Class-based cachable, now reactive & backwards compatible with ICacheable
 */
export class Cacheable<T> implements ICacheable<T> {
  public $loading: BehaviorSubject<boolean>;
  public data: T;
  public formErrors?: { [index: string]: Array<[i18nToken, string]> };
  public error: string | HttpErrorResponse | null;
  public meta: { [index: string]: any };

  constructor(cache?: Partial<ICacheable<T>>) {
    this.$loading = new BehaviorSubject(cache?.loading || false);
    this.data = cache?.data || null;
    this.meta = cache?.meta || {};
    this.formErrors = cache?.form_errors || {};
    this.error = cache?.error || '';
  }

  set loading(value: boolean) {
    this.$loading.next(value);
  }

  get loading() {
    return this.$loading.getValue();
  }

  async request(p: Promise<T>) {
    return cachize(p, this);
  }
}

export enum LocalStorageKey {
  Myself = '__myself'
}

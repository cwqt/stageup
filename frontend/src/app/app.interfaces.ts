import { ErrCode } from "@eventi/interfaces";

export interface ICacheable<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  form_errors?: FormErrors;
  meta?: { [index: string]: any };
}

export interface FormErrors {
  [index:string]: null | ErrCode | FormErrors;
}


export const createICacheable = ():ICacheable<null> => {
  return {
    data: null,
    loading: false,
    error: "",
    form_errors: {},
    meta: {}
  }
}
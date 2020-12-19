import { HTTP } from './Http';

export interface IErrorResponse {
  status: 'fail' | 'error';
  statusCode: HTTP;
  message: string;
  errors: IFormErrorField[];
}

export interface IFormErrorField {
  param: string;
  msg: string;
  value: any;
  location?: 'body' | 'param' | 'query';
}

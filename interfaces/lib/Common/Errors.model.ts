import { HTTP } from './Http';

export enum ErrCode {
  IN_USE = "IN_USE",
  NOT_FOUND = "NOT_FOUND",
  FORBIDDEN = "FORBIDDEN", // cannot be used
  INCORRECT = "INCORRECT", // doesn't fit expected values
  INVALID = "INVALID", // doesn't fit regexes / validators
  TOO_SHORT = "TOO_SHORT",
  TOO_LONG = "TOO_LONG",
}

export interface IErrorResponse {
  status: 'fail' | 'error'; // fail = internal server error
  statusCode: HTTP;
  message: string;
  errors: IFormErrorField[];
}

export interface IFormErrorField {
  value?: any;
  param: string;
  code: ErrCode;
  location?: 'body' | 'param' | 'query';
  nestedErrors?:IFormErrorField[];
  idx?:number; // for errors in an .array
}

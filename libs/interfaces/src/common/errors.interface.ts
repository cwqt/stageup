import { HTTP } from './http.interface';

export enum ErrCode {
  MISSING_FIELD = "MISSING_FIELD", // wasn't even present in data
  INVALID_EMAIL = "INVALID_EMAIL", // more specific invalid
  REGEX_MATCH   = "REGEX_MATCH",   // didn't match expected pattern
  IN_USE        = "IN_USE",        // email/username in use by someone else
  DUPLICATE     = "DUPLICATE",     // object already exists
  NOT_FOUND     = "NOT_FOUND",     // no such x exists
  FORBIDDEN     = "FORBIDDEN",     // cannot be used
  INCORRECT     = "INCORRECT",     // expected one value, but got another
  INVALID       = "INVALID",       // general invalid error
  TOO_SHORT     = "TOO_SHORT",     // < x chars
  TOO_LONG      = "TOO_LONG",      // > x charts
  NO_SESSION    = "NO_SESSION",    // not logged in
  MISSING_PERMS = "MISSING_PERMS", // auth level too low
  NOT_MEMBER    = "NOT_MEMBER",    // not a member of host
  NOT_ADMIN     = "NOT_ADMIN",     // must be a site admin
  EMAIL_SEND    = "EMAIL_SEND",    // failed sending email
  NOT_VERIFIED  = "NOT_VERIFIED",  // user/host not verified
  LOCKED        = "LOCKED",        // object is locked
  UNKNOWN       = "UNKNOWN",       // unknown error
  NOT_URL       = "NOT_URL",       // not a valid url
  NO_DATA       = "NO_DATA",       // expected input but none given
  NO_SUCH_ROUTE = "NO_SUCH_ROUTE", // no api route at this path
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED"
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

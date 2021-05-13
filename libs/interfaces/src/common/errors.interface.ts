import { DottedPaths } from './fp.interface';
import { HTTP } from './http.interface';
import { i18nToken } from '../i18n/i18n.interface';

// const message = {
//   status: HTTP.Conflict,            // http error code
//   code: "@@error.code",             // i18n string
//   message: "Basically all fucked",  // top level error message
//   errors: [                         // body errors
//     {
//       value: "what the fuck",       // given value
//       path: "hello.world[0].age",   // dotted path accessor
//       message: "this is fucked",    // i18n string
//       code: "@@error.code",         // internal error code
//       location: "body" | "query" | "params"
//     }
//   ]
// }

export type ErrorMessage = {
  code: i18nToken;
  message?: string;
};

export interface IErrorResponse extends ErrorMessage {
  status: HTTP;
  errors: IFormErrorField[];
}

export type RequestLocation = 'body' | 'params' | 'query';

export interface IFormErrorField extends ErrorMessage {
  value?: any;
  path: DottedPaths<any>;
  location?: RequestLocation;
}

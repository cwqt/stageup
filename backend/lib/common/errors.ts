import { Request, Response, NextFunction } from 'express';
import log from './logger';
import { IFormErrorField, HTTP, IErrorResponse, ErrCode } from '@eventi/interfaces';

/**
 * @description Used for checking if something exists, else throw a not found
 * @param f
 */
export const getCheck = async <T>(f: Promise<T>): Promise<T> => {
  const v = await f;
  if (v == null || v == undefined) throw new ErrorHandler(HTTP.NotFound, ErrCode.NOT_FOUND);
  return v;
};

export const handleError = (req: Request, res: Response, next: NextFunction, err: ErrorHandler | Error) => {
  const errorType: HTTP = err instanceof ErrorHandler ? err.errorType : HTTP.ServerError;
  const message: string = err.message;

  const response: IErrorResponse = {
    status: `${errorType}`.startsWith('4') ? 'fail' : 'error',
    statusCode: errorType || 520,
    message: message,
    errors: err instanceof ErrorHandler ? err.errors : []
  };

  log.error(`(${errorType}) --> ${JSON.stringify(err.message)}`);
  if (errorType !== HTTP.NotFound) console.log(err.stack);

  res.status(response.statusCode).json(response);
};

export class ErrorHandler extends Error {
  errorType: HTTP;
  errors: IFormErrorField[];

  constructor(statusCode: HTTP, message?: ErrCode, errors?: IFormErrorField[]) {
    super();
    this.errorType = statusCode;
    this.message = message || ErrCode.INVALID;
    this.errors = errors || [];
  }
}

export class FormErrorResponse {
  errors: IFormErrorField[];
  constructor() {
    this.errors = [];
  }

  push(param: string, message: ErrCode, value: IFormErrorField['value'], location?: IFormErrorField['location']) {
    this.errors.push({ param: param, code: message, value: value, location: location });
  }

  get value() {
    return this.errors;
  }
}

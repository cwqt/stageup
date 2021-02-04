import { Request, Response, NextFunction } from 'express';
import log from './logger';
import { IFormErrorField, HTTP, IErrorResponse, ErrCode } from '@core/interfaces';

/**
 * @description Used for checking if something exists, else throw a not found
 * @param f
 */
export const getCheck = async <T>(f: Promise<T>): Promise<T> => {
  const v = await f;
  if (v === null || v === undefined) {
    throw new ErrorHandler(HTTP.NotFound, ErrCode.NOT_FOUND);
  }

  return v;
};

export const handleError = (request: Request, res: Response, next: NextFunction, error: ErrorHandler | Error) => {
  const errorType: HTTP = error instanceof ErrorHandler ? error.errorType : HTTP.ServerError;
  const message: string = error.message;

  const response: IErrorResponse = {
    status: `${errorType}`.startsWith('4') ? 'fail' : 'error',
    statusCode: errorType || 520,
    message: message,
    errors: error instanceof ErrorHandler ? error.errors : []
  };

  log.error(`(${errorType}) --> ${JSON.stringify(error.message)}`);
  if (errorType !== HTTP.NotFound) {
    console.log(error.stack);
  }

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

  push(param: string, code: ErrCode, value: IFormErrorField['value'], location?: IFormErrorField['location']) {
    this.errors.push({ param, code, value, location });
  }

  get value() {
    return this.errors;
  }
}

import { Request, Response, NextFunction } from 'express';
import log from './logger';
import { IFormErrorField, HTTP, IErrorResponse } from '@eventi/interfaces';

export const handleError = (req: Request, res: Response, next: NextFunction, err: ErrorHandler | Error) => {
  const errorType: HTTP = err instanceof ErrorHandler ? err.errorType : HTTP.ServerError;
  const message: string = err.message;

  const response: IErrorResponse = {
    status: `${errorType}`.startsWith('4') ? 'fail' : 'error',
    statusCode: errorType || 520,
    message: message,
    errors: err instanceof ErrorHandler ? err.errors : [],
  };

  log.error(`(${errorType}) --> ${JSON.stringify(err.message)}`);
  if (errorType !== HTTP.NotFound) console.log(err.stack);

  res.status(response.statusCode).json(response);
};

export class ErrorHandler extends Error {
  errorType: HTTP;
  errors: IFormErrorField[];

  constructor(statusCode: HTTP, message?: string, errors?: IFormErrorField[]) {
    super();
    this.errorType = statusCode;
    this.message = message || 'An error occured.';
    this.errors = errors || [];
  }
}

export class FormErrorResponse {
  errors: IFormErrorField[];
  constructor() {
    this.errors = [];
  }

  push(param: string, message: string, value: string, location?: 'body' | 'param' | 'query') {
    this.errors.push({ param: param, msg: message, value: value, location: location });
  }

  get value() {
    return this.errors;
  }
}

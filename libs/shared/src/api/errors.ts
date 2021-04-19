import { Request, Response, NextFunction } from 'express';
import { IFormErrorField, HTTP, IErrorResponse, ErrCode } from '@core/interfaces';
import { Logger } from 'winston';

/**
 * @description Used for checking if an entity exists, else throw a NOT_FOUND
 * @param f
 * @example await getCheck(User.findOne({ name: "hello" }));
 */
export const getCheck = async <T>(f: Promise<T>, code?: ErrCode): Promise<T> => {
  const v = await f;
  if (v === null || v === undefined) {
    throw new ErrorHandler(HTTP.NotFound, code || ErrCode.NOT_FOUND);
  }

  return v;
};

export const handleError = (
  request: Request,
  res: Response,
  next: NextFunction,
  error: ErrorHandler | Error,
  log: Logger
) => {
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

export const global404Handler = logger => (req: Request, res: Response, next: NextFunction) =>
  handleError(req, res, next, new ErrorHandler(HTTP.NotFound, ErrCode.NO_SUCH_ROUTE), logger);

export const globalErrorHandler = logger => (err: any, req: Request, res: Response, next: NextFunction) => {
  handleError(req, res, next, err, logger);
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

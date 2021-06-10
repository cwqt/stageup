import { Request, Response, NextFunction } from 'express';
import { IFormErrorField, HTTP, IErrorResponse, i18nToken, i18nTokenMap } from '@core/interfaces';
import { Logger } from 'winston';
import { i18nProvider } from './i18n';
import colors = require('colors');

/**
 * @description Used for checking if an entity exists, else throw a NOT_FOUND
 * @param f
 * @example await getCheck(User.findOne({ name: "hello" }));
 */
export const getCheck = async <T>(f: Promise<T>, code?: i18nToken): Promise<T> => {
  const v = await f;
  if (v === null || v === undefined) {
    throw new ErrorHandler(HTTP.NotFound, code || '@@error.not_found');
  }

  return v;
};

export const handleError = (
  req: Request,
  res: Response,
  next: NextFunction,
  error: ErrorHandler | Error,
  log: Logger,
  i18n?: i18nProvider<any>
) => {
  const statusCode: HTTP = error instanceof ErrorHandler ? error.statusCode : HTTP.ServerError;

  console.log(error['errors']);

  const response: IErrorResponse =
    error instanceof ErrorHandler && i18n
      ? {
          status: statusCode,
          code: error.message,
          message: i18n.translate(error.message, { language: req.locale.language, region: req.locale.region }, {}),
          errors: error.errors.map(e => ({
            ...e,
            message: i18n.translate(e.code, { language: req.locale.language, region: req.locale.region })
          }))
        }
      : {
          status: statusCode,
          code: error.message,
          message: error.message,
          errors: []
        };

  log.error(`(${statusCode}) ${colors.bold(error.message)}`);
  if (response.errors) log.error(JSON.stringify(response.errors, null, 2));
  if (statusCode !== HTTP.NotFound) console.log(error.stack);

  res.status(statusCode).json(response);
};

export const global404Handler = (logger, i18n?) => (req: Request, res: Response, next: NextFunction) =>
  handleError(req, res, next, new ErrorHandler(HTTP.NotFound, '@@error.not_such_route'), logger, i18n);

export const globalErrorHandler = (logger, i18n?) => (err: any, req: Request, res: Response, next: NextFunction) => {
  handleError(req, res, next, err, logger, i18n);
};

export class ErrorHandler extends Error {
  statusCode: HTTP;
  errors: IFormErrorField[];

  constructor(statusCode: HTTP, message?: string, errors?: IFormErrorField[]) {
    super();
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors || [];
  }
}

export class FormErrorResponse {
  errors: IFormErrorField[];
  constructor() {
    this.errors = [];
  }

  condition(
    condition: boolean,
    path: string,
    token: i18nToken,
    value: IFormErrorField['value'],
    location?: IFormErrorField['location']
  ) {
    if (condition) this.errors.push({ path, code: token, value, location, message: '' });
    return this;
  }

  check(status: HTTP, token: i18nToken) {
    if (this.errors.length > 0) throw new ErrorHandler(status, token, this.errors);
  }

  get value() {
    return this.errors;
  }
}

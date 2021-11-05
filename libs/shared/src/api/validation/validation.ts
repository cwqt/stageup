import { ErrorHandler } from '@core/api';
import { HTTP, IFormErrorField, RequestLocation } from '@core/interfaces';
import { RequestHandler } from 'express-async-router';
import { create, Struct, StructError } from 'superstruct';

export const formatError = (error: StructError): IFormErrorField[] => {
  return error.failures().map(failure => ({
    path: failure.path.join('.'),
    value: failure.value,
    code: failure.message || '@@validation.invalid'
  }));
};

/**
 * @description Middleware for validating requests
 * @param validators VReqHandlerFunctor array
 */
export const validationMiddleware = (validators: { [index in RequestLocation]?: Struct }): RequestHandler => {
  return async (req, res, next) => {
    let errors: IFormErrorField[] = [];
    
    await Promise.allSettled(
      Object.entries(validators).map(async ([key, value]) => {
        try {
          req[key] = create(req[key], value);
        } catch (error) {
          if (error instanceof StructError) {
            errors = formatError(error).map(error => ({ ...error, location: key as RequestLocation }));
          }
        }
      })
    );

    if (errors.length > 0) throw new ErrorHandler(HTTP.BadRequest, '@@validation.invalid', errors);
    next();
  };
};

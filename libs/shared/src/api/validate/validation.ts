import { HTTP, IFormErrorField, RequestLocation } from '@core/interfaces';
import { RequestHandler } from 'express-async-router';
import { ErrorHandler } from '@core/api';

// MIDDLEWARE =================================================================================================

import { Struct, StructError, create } from 'superstruct';
import { i18nProvider } from '../i18n';

/**
 * @description Middleware for validating requests
 * @param validators VReqHandlerFunctor array
 */
export const validationMiddleware = (
  validators: { [index in RequestLocation]?: Struct },
  i18n: i18nProvider
): RequestHandler => {
  return async (req, res, next) => {
    let errors: IFormErrorField[] = [];

    await Promise.allSettled(
      Object.entries(validators).map(async ([key, value]) => {
        try {
          req[key] = create(req[key], value);
        } catch (error) {
          if (error instanceof StructError) {
            errors = errors.concat(
              error.failures().map(failure => ({
                path: failure.path.join('.'),
                value: failure.value,
                code: failure.message || '@@validation.invalid',
                location: key as RequestLocation
              }))
            );
          }
        }
      })
    );

    if (errors.length > 0) throw new ErrorHandler(HTTP.BadRequest, '@@validation.invalid', errors);
    next();
  };
};

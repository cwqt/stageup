import { HTTP, IFormErrorField, ErrCode } from '@eventi/interfaces';
import { Request } from 'express';
import { NextFunction, Response } from 'express-async-router';
import {
  CustomValidator,
  Meta,
  ValidationChain,
  Location,
  ValidationError,
  body as bodyRunner,
  param as parameterRunner,
  query as queryRunner
} from 'express-validator';

import { ErrorHandler } from '../errors';

type VData<T> = T & {
  __this?: T; // Self-reference
  __callee?: Location | null; // Where it was called from, either plain object or reqHandler as Location
} & Record<string, any>;

type VChainer = (v: ValidationChain) => ValidationChain;

type VFieldChainerMap<T> = { [index in keyof VData<T>]: VChainer };

type VFunctor = <T extends Record<string, unknown>>(
  data: T,
  validators: VFieldChainerMap<T>,
  location?: Location,
  index?: number
) => Promise<IFormErrorField[]>;

type VRequestHandlerFunctor = (request: Request) => Promise<IFormErrorField[]>;

// Takes either req[location] as starting point or data in the case of nested objects/arrays
type VRequestHandler = <T extends Record<string, unknown>>(
  validators: VFieldChainerMap<T>,
  data?: T
) => VRequestHandlerFunctor;

type VArrayReturn = { errors: IFormErrorField[]; message: string };

// VFunctor  T       VData<T>
//   v       v          v
// object<IAddress>(address, {   <-- VFieldChainerMap<T>
//  street_name: v => v.isInt()
//     ^            ^
//   keyof T     VChainer
//
// });

// ============================================================================================================

const validatorRunnerMap: { [index in Location]?: typeof bodyRunner } = {
  body: bodyRunner,
  query: queryRunner,
  params: parameterRunner
};

/**
 * @description Run the validator against data on field (using the location runner)
 * @param data Object to be validated
 * @param field Field mapping to object value
 * @param f ValidationChain
 * @param runner express-validator runner (when used as middleware)
 */
export const runValidator = async <T extends Record<string, unknown>, U extends keyof T>(
  data: T,
  field: U,
  f: VChainer,
  location: Location | null
): Promise<IFormErrorField[]> => {
  // Now add in the __this self reference for self array checks
  // e.g. body().isArray() in express-validator
  const wrappedData: VData<T> = {
    ...data,
    __this: data,
    __callee: location
  };

  // Pick the express-validator runner to ensure 'location' is correct
  const runner = f(
    validatorRunnerMap[location ? location : 'body']((field == '__this' ? `__this.${field}` : field) as string)
  );

  const errors: ValidationError[] = (
    await runner.run({
      [location ? location : 'body']: Array.isArray(data) ? wrappedData.__this : wrappedData
    })
  ).array();

  return (errors || []).map(e => {
    const res = {
      value: e.value,
      code: e.msg == 'Invalid value' ? ErrCode.INVALID : e.msg,
      param: e.param
    };

    // No location passed (in the case of used directly via object())
    // remove the object since wasn't called from a VReqHandlerFunctor
    return (location ? { ...res, location: e.location } : res) as IFormErrorField;
  });
};

/**
 * @description Validate an object using express-validator
 * @param data Object body - cannot take arrays
 * @param validators key-value pair of field-vchainer
 * @param location used by VReqHandlerFunctors to specify location of field
 */
export const object: VFunctor = async (data, validators, location = null, index = null): Promise<IFormErrorField[]> => {
  const errors: IFormErrorField[] = (
    await Promise.all(
      Object.keys(validators).map(async (index: any) => runValidator(data, index, validators[index], location))
    )
  ).flat();

  errors.forEach((e: any) => {
    // Handle .arrays & .single
    if (e.code.errors) {
      // Don't need to take up bandwidth when we've indexed the errors
      // in an .array
      if (Array.isArray(e.value)) {
        delete e.value;
      }

      e.nestedErrors = e.code.errors;
      e.code = e.code.message;
    }
  });

  // Filter .singles that threw but had no actual errors
  return errors.filter(e => {
    if (Array.isArray(e.nestedErrors) && e.nestedErrors.length === 0) {
      return false;
    }

    return true;
  });
};

/**
 * @description Validate an nested array of objects
 */
export const array = <T extends Record<string, unknown>>(
  validators: VFieldChainerMap<T>,
  code?: ErrCode
): CustomValidator => {
  return async (data: T[] | VData<T[]>, meta: Meta) => {
    if (!data) {
      throw { message: ErrCode.NOT_FOUND };
    }

    const errors = (await Promise.allSettled(data.map(index => single(validators)(index, meta))))
      // Have a IFormErrorField[] for each field according to each validation in the chain
      .map((e, index) => {
        // Append indexes into field errors
        return (e as PromiseRejectedResult).reason.errors.map((index_: IFormErrorField) => ({ ...index_, idx: index }));
      }) // Filter out fields with no errors
      .filter(e => e.length > 0)
      .flat()
      .filter(e => e.nestedErrors != 0);

    // Array should only sometimes throw
    if (errors.length > 0) {
      throw {
        // Throw custom object to include the message since .withMessage chainer doesn't work with .custom
        message: code ?? ErrCode.INVALID,
        // Use all settled as all singles will throw error & be rejected
        errors
      };
    }
  };
};

/**
 * @description Validate a single nested object
 */
export const single = <T extends Record<string, unknown>>(
  validators: VFieldChainerMap<T>,
  code?: ErrCode
): CustomValidator => {
  return async (data: VData<T> | T, meta: Meta, index: number = null) => {
    if (!data) {
      throw 'Object does not exist';
    }

    let e: IFormErrorField[];
    e = await (meta.req[meta.location].__callee == null
      ? object(data, validators, null, index)
      : requestHandlerFunctorMap[meta.location](validators, data)(meta.req as Request));

    // Single should always throw
    throw {
      message: code ?? ErrCode.INVALID,
      errors: e
    };
  };
};

// MIDDLEWARE =================================================================================================

/**
 * @description Middleware for validating requests
 * @param f VFunctorFactory array
 */
export const validatorMiddleware = (validators: VRequestHandlerFunctor[]) => {
  return async (request: Request, res: Response, next: NextFunction) => {
    const errors: IFormErrorField[] = (await Promise.allSettled(validators.map(async v => v(request))))
      .flat()
      .filter(e => e.status == 'fulfilled')
      .flatMap(e => (<any>e).value);

    if (errors.length > 0) {
      console.log(JSON.stringify(errors, null, 2));
    }

    if (errors.length > 0) {
      throw new ErrorHandler(HTTP.BadRequest, ErrCode.INVALID, errors);
    }

    next();
  };
};

/**
 * @description Validating body, query & parameters
 * @param fields key-value pair of field-vchainer
 * @example body({ name: v => v.notEmpty() })
 */
export const body: VRequestHandler = (validators, data) => async (request: Request) =>
  object<VData<Record<string, unknown>>>(data || request.body, validators, 'body');

export const query: VRequestHandler = (validators, data) => async (request: Request) =>
  object<VData<Record<string, unknown>>>(data || request.query, validators, 'query');

export const params: VRequestHandler = (validators, data) => async (request: Request) =>
  object<VData<Record<string, unknown>>>(data || request.params, validators, 'params');

// Mappings between Location & VReqHandler's
const requestHandlerFunctorMap: { [index in Location]?: VRequestHandler } = {
  body,
  query,
  params
};

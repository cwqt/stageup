import { HTTP, IFormErrorField, ErrCode } from '@eventi/interfaces';
import { Request } from 'express';
import { NextFunction, Response } from 'express-async-router';
import { CustomValidator, Meta, ValidationChain, Location, ValidationError } from 'express-validator';
import { body as bodyRunner, param as paramRunner, query as queryRunner } from 'express-validator';
import { ErrorHandler } from '../errors';
import logger from '../logger';

type VData<T> = T & {
  __this?: T; // self-reference
  __callee?: Location | null; // where it was called from, either plain object or reqHandler as Location
} & { [index: string]: any };

type VChainer = (v: ValidationChain) => ValidationChain;

type VFieldChainerMap<T> = { [index in keyof VData<T>]: VChainer };

type VFunctor = <T extends object>(
  data: T,
  validators: VFieldChainerMap<T>,
  location?: Location,
  idx?: number
) => Promise<IFormErrorField[]>;

type VReqHandlerFunctor = (req: Request) => Promise<IFormErrorField[]>;

// Takes either req[location] as starting point or data in the case of nested objects/arrays
type VReqHandler = <T extends object>(validators: VFieldChainerMap<T>, data?: T) => VReqHandlerFunctor;

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
  params: paramRunner,
};

/**
 * @description Run the validator against data on field (using the location runner)
 * @param data Object to be validated
 * @param field Field mapping to object value
 * @param f ValidationChain
 * @param runner express-validator runner (when used as middleware)
 */
export const runValidator = async <T extends object, U extends keyof T>(
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
    __callee: location,
  };

  // Pick the express-validator runner to ensure 'location' is correct
  const runner = f(
    validatorRunnerMap[location ? location : 'body']((field == '__this' ? `__this.${field}` : field) as string)
  );

  const errors: ValidationError[] = (
    await runner.run({
      [location ? location : 'body']: Array.isArray(data) ? wrappedData.__this : wrappedData,
    })
  ).array();

  return (errors || []).map(e => {
    const res = {
      value: e.value,
      code: e.msg == 'Invalid value' ? ErrCode.INVALID : e.msg,
      param: e.param,
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
export const object: VFunctor = async (data, validators, location = null, idx = null): Promise<IFormErrorField[]> => {
  const errors: IFormErrorField[] = (
    await Promise.all(Object.keys(validators).map((i: any) => runValidator(data, i, validators[i], location)))
  ).flat();

  errors.forEach((e: any) => {
    // handle .arrays & .single
    if (e.code.errors) {
      // don't need to take up bandwidth when we've indexed the errors
      // in an .array
      if (Array.isArray(e.value)) delete e.value;

      e.nestedErrors = e.code.errors;
      e.code = e.code.message;
    }
  });

  // Filter .singles that threw but had no actual errors
  return errors.filter(e => {
    if (Array.isArray(e.nestedErrors) && e.nestedErrors.length == 0) return false;
    return true;
  });
};

/**
 * @description Validate an nested array of objects
 */
export const array = <T extends object>(validators: VFieldChainerMap<T>, code?: ErrCode): CustomValidator => {
  return async (data: T[] | VData<T[]>, meta: Meta) => {
    if (!data) throw { message: ErrCode.NOT_FOUND };

    const errors = (await Promise.allSettled(data.map(i => single(validators)(i, meta))))
      // have a IFormErrorField[] for each field according to each validation in the chain
      .map((e, idx) => {
        // append indexes into field errors
        return (e as PromiseRejectedResult).reason.errors.map((i: IFormErrorField) => ({ ...i, idx: idx }));
      }) // filter out fields with no errors
      .filter(e => e.length != 0)
      .flat()
      .filter(e => e.nestedErrors != 0);

    // Array should only sometimes throw
    if (errors.length) {
      throw {
        // throw custom object to include the message since .withMessage chainer doesn't work with .custom
        message: code ?? ErrCode.INVALID,
        // use all settled as all singles will throw error & be rejected
        errors: errors,
      };
    }
  };
};

/**
 * @description Validate a single nested object
 */
export const single = <T extends object>(validators: VFieldChainerMap<T>, code?: ErrCode): CustomValidator => {
  return async (data: VData<T> | T, meta: Meta, idx: number = null) => {
    if (!data) throw 'Object does not exist';

    let e: IFormErrorField[];
    if (meta.req[meta.location].__callee == null) {
      e = await object(data, validators, null, idx);
    } else {
      e = await reqHandlerFunctorMap[meta.location](validators, data)(meta.req as Request);
    }

    // Single should always throw
    throw {
      message: code ?? ErrCode.INVALID,
      errors: e,
    };
  };
};

// MIDDLEWARE =================================================================================================

/**
 * @description Middleware for validating requests
 * @param f VFunctorFactory array
 */
export const validatorMiddleware = (validators: VReqHandlerFunctor[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: IFormErrorField[] = (await Promise.allSettled(validators.map(v => v(req))))
      .flat()
      .filter(e => e.status == 'fulfilled')
      .flatMap(e => (<any>e).value);

    console.log(JSON.stringify(errors, null, 2));
    if (errors.length) throw new ErrorHandler(HTTP.BadRequest, ErrCode.INVALID, errors);
    next();
  };
};

/**
 * @description Validating body, query & parameters
 * @param fields key-value pair of field-vchainer
 * @example body({ name: v => v.notEmpty() })
 */
export const body: VReqHandler = (validators, data) => (req: Request) =>
  object<VData<object>>(data || req.body, validators, 'body');

export const query: VReqHandler = (validators, data) => (req: Request) =>
  object<VData<object>>(data || req.query, validators, 'query');

export const params: VReqHandler = (validators, data) => (req: Request) =>
  object<VData<object>>(data || req.params, validators, 'params');

// mappings between Location & VReqHandler's
const reqHandlerFunctorMap: { [index in Location]?: VReqHandler } = {
  body: body,
  query: query,
  params: params,
};

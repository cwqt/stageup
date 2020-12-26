import { HTTP, IFormErrorField } from '@eventi/interfaces';
import { Request } from 'express';
import { NextFunction, Response } from 'express-async-router';
import { CustomValidator, Meta, ValidationChain, Location } from 'express-validator';
import { body as bodyRunner, param as paramRunner, query as queryRunner } from 'express-validator';
import { ErrorHandler } from './errors';

type VData<T> = T & { __this?: T } & { [index: string]: any };
type VChainer = (v: ValidationChain) => ValidationChain;
type VFieldChainerMap<T> = { [index in keyof VData<T>]: VChainer };

type VFunctor = <T extends object>(
  data: T,
  validators: VFieldChainerMap<T>,
  runner?: any
) => VFunctorReturn;

type VFunctorReturn = (opt?:any) => Promise<IFormErrorField[]>;
export type VFunctorReqHandler = (req:Request) => VFunctorReturn;
type VFunctorFactory = <T extends object>(validators: VFieldChainerMap<T>) => VFunctorReqHandler;


// VFunctor  T       VData<T>
//   v       v          v
// object<IAddress>(address, {
//  street_name: v => v.isInt()
//     ^            ^
//   keyof T     VChainer
//
// });

/**
 * @description Validating body, query & parameters
 * @param fields key-value pair of field-vchainer
 * @example body({ name: v => v.notEmpty() })
 */
export const body: VFunctorFactory = (validators) => (req: Request) => object<VData<any>>(req.body, validators, bodyRunner);
export const query: VFunctorFactory = (validators) => (req: Request) => object<VData<any>>(req.query, validators, queryRunner);
export const params: VFunctorFactory = (validators) => (req: Request) => object<VData<any>>(req.params, validators, paramRunner);

const validatorRunnerMap: { [index in Location]?: typeof bodyRunner } = {
  body: bodyRunner,
  query: queryRunner,
  params: paramRunner,
};

const validatorFunctorMap: { [index in Location]?: VFunctorFactory } = {
  body: body,
  query: query,
  params: params,
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
  location: Location = 'body'
): Promise<IFormErrorField[]> => {
  // Now add in the __this self reference for self array checks
  // e.g. body().isArray() in express-validator
  const wrappedData: VData<T> = {
    ...data,
    __this: data,
  };

  // Pick the express-validator runner to ensure 'location' is correct
  const runner = f(validatorRunnerMap[location]((field == '__this' ? '' : field) as string));
  const res = await runner.run({
    body: wrappedData,
    query: wrappedData,
    params: wrappedData,
  });

  return (<any>res)?.errors || [];
};

/**
 * @description Validate an object using express-validator
 * @param data Object body
 * @param validators key-value pair of field-vchainer
 */
export const object: VFunctor = (data, validators, runner = bodyRunner) => {
  return async (opt: any): Promise<IFormErrorField[]> => {
    return (
      await Promise.all(
        Object.keys(validators).map((i: any) => runValidator(opt || data, i, (<any>validators)[i], runner))
      )
    ).flat();
  };
};

/**
 * @description Middleware for validating requests
 * @param f VFunctorFactory array
 */
export const validatorMiddleware = (validators: VFunctorReqHandler[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors:IFormErrorField[] = (await Promise.all(validators.map((v) => v(req)()))).flat();
    if(errors.length) throw new ErrorHandler(HTTP.BadRequest, "Invalid data", errors);

    next();
  };
};

/**
 * @description Validate an nested array of objects
 */
export const array = <T extends object>(validators: VFieldChainerMap<T>): CustomValidator => {
  return async (d: T[], meta: Meta) => {
    if (!d) throw 'Array does not exist';

    const e = (
      await Promise.all(d.map((i) => validatorFunctorMap[meta.location](validators)(meta.req as Request)(i)))
    ).flatMap((e, idx) => ({ ...e, idx: idx }));

    // TODO: recurse through children and check to throw
    if (e.length) throw e;
    return;
  };
};

/**
 * @description Validate a single nested object
 */
export const single = <T extends object>(validators: VFieldChainerMap<T>): CustomValidator => {
  return async (data: T, meta: Meta) => {
    if (!data) throw 'Object does not exist';

    const e = await validatorFunctorMap[meta.location](validators)(meta.req as Request)(data);
    if (e.length) throw e;
    return;
  };
};

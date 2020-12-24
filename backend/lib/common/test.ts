import { IFormErrorField } from '@eventi/interfaces';
import { Request } from 'express';
import { NextFunction, Response } from 'express-async-router';
import { CustomValidator, Meta, ValidationChain, Location } from 'express-validator';
import { body as bodyRunner, param as paramRunner, query as queryRunner } from 'express-validator';

type VChainer = (v: ValidationChain) => ValidationChain;
type VFunctor = <T extends object>(
  data: T,
  validators: { [index in keyof T]: VChainer },
  runner?: any
) => (opt?: any) => Promise<IFormErrorField[]>;

export const runValidator = async <T extends object, U extends keyof T>(
  data: T,
  field: U,
  f: VChainer,
  runner = bodyRunner
): Promise<IFormErrorField[]> => {
  const res = await f(runner(field as string)).run({ body: data, query: data, params: data });
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

export type VFF = (req: Request) => () => Promise<IFormErrorField[]>;
type VFunctorFactory = <T extends object>(
  fields: { [index in keyof T]: VChainer }
) => (req: Request) => (opt?: any) => Promise<IFormErrorField[]>;

/**
 * @description Validating body, query & parameters
 * @param fields key-value pair of field-vchainer
 * @example body({ name: v => v.notEmpty() })
 */
export const body: VFunctorFactory = (validators) => (req: Request) => object(req.body, validators, bodyRunner);
export const params: VFunctorFactory = (validators) => (req: Request) =>
  object<any>(req.params, validators, paramRunner);
export const query: VFunctorFactory = (validators) => (req: Request) => object<any>(req.query, validators, queryRunner);


export const validatorMiddleware = (validators:VFF[]) => {
  return async (req:Request, res:Response, next:NextFunction) => {
    await validate(validators);
    next();
  }
}


/**
 * @description Middleware for validating requests
 * @param f VFunctorFactory array
 */
export const validate = (f: Array<VFF>) => {
  return async (req: Request): Promise<IFormErrorField[]> => {
    return (await Promise.all(f.map((v) => v(req)()))).flat();
  };
};

const vFunctorMap: { [index in Location]?: VFunctorFactory } = {
  body: body,
  query: query,
  params: params,
};

/**
 * @description Validate an nested array of objects 
 */
export const array = <T extends object>(validators: { [index in keyof T]: VChainer }): CustomValidator => {
  return async (d: T[], meta: Meta) => {
    if (!d) throw 'Array does not exist';

    const e = (
      await Promise.all(d.map((i) => vFunctorMap[meta.location](validators)(meta.req as Request)(i)))
    ).flatMap((e, idx) => ({ ...e, idx: idx }));

    // TODO: recurse through children and check to throw
    if (e.length) throw e;
    return;
  };
};

/**
 * @description Validate a single nested object 
 */
export const single = <T extends object>(validators: { [index in keyof T]: VChainer }): CustomValidator => {
  return async (data: T, meta: Meta) => {
    if(!data) throw "Object does not exist";

    const e = await vFunctorMap[meta.location](validators)(meta.req as Request)(data);
    if (e.length) throw e;
    return;
  };
};

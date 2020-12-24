const { validationResult } = require('express-validator');
import { ErrorHandler } from './errors';
import { Request, Response, NextFunction } from 'express';
import {
  HTTP,
  IAddress,
  IContactInfo,
  IFormErrorField,
  IHostMemberChangeRequest,
  IPersonInfo,
  PersonTitle,
} from '@eventi/interfaces';
import { body } from 'express-validator';
import { ValidationChain } from 'express-validator';
import { version } from 'winston';

export type Validator = Array<(req: Request, res: Response | null, next: NextFunction) => void>;
export const validate = (validations: Function[]) => {
  return (req: Request, res: Response | null, next: NextFunction) => {
    Promise.all(validations.map((validation: any) => validation.run(req))).then(() => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ErrorHandler(HTTP.BadRequest, 'Invalid form data', errors.array()));
      }

      next();
    });
  };
};

// TODO: re-write this around validator.js and not bending express-validator to my will
// so that nested validations actually work without stupid hacks
type VFunctorWrapper = any;
type VFunctor = (v: ValidationChain, k?: VFunctorWrapper) => ValidationChain;

export const validateAsync = async <T extends object, U extends keyof T>(
  data: T,
  field: U,
  f: VFunctor
): Promise<IFormErrorField[]> => {
  const res = await f(body(field as string)).run({ body: data });
  return (<any>res)?.errors || [];
};

export const validateObject = async <T extends object, U extends keyof T>(
  data: T,
  validators: { [index in U]: VFunctor },
  isPartial:boolean=false
): Promise<IFormErrorField[]> => {
  return (
    await Promise.all(
      Object.keys(validators).reduce<Promise<IFormErrorField[]>[]>((acc, curr) => {
        if(isPartial && !data[curr as U]) {
          return acc;
        }

        return [...acc, validateAsync(data, curr as U, validators[curr as U])];
      }, [])
    )
  )
    .flat()
    //so many hacks
    .map((v) => {
      if (Array.isArray(v.msg)) {
        v.nestedErrors = [...v.msg];
        v.msg = 'Invalid fields';
      }
      return v;
    })
    .filter((v) => {
      if (v.nestedErrors && v.nestedErrors.length == 0) return false;
      return true;
    });
};

// really disgusting im sorry
export const runMany = async (i: any[], f: Function, isPartial:boolean=false) => {
  let x = (await Promise.all(i.map((x) => f(x, isPartial)))).map((x) => ({ ...x }));
  if (Object.values(x).every((y) => Object.keys(y).length === 0)) return;
  throw x;
};

export const validators: { [index: string]: any } = {
  IHostMemberChangeRequestValidator: (memberChangeReq: IHostMemberChangeRequest, isPartial:boolean=false) =>
    validateObject(memberChangeReq, {
      change: (v) => v.isIn(['add', 'update', 'del']),
      user_id: (v) => v.isInt(),
      value: (v) => v.optional().notEmpty(),
    }, isPartial),

  IAddressValidator: (address: IAddress, isPartial:boolean=false) =>
    validateObject(address, {
      city: (v) => v.notEmpty().isString(),
      iso_country_code: (v) => v.notEmpty().isISO31661Alpha3(),
      postcode: (v) => v.notEmpty().isPostalCode('GB'),
      street_name: (v) => v.notEmpty().isString(),
      street_number: (v) => v.notEmpty().isInt(),
    }, isPartial),

  IContactInfoValidator: (contactInfo: IContactInfo, isPartial:boolean=false) =>
    validateObject(contactInfo, {
      landline_number: (v) => v.isInt(),
      mobile_number: (v) => v.isInt(),
      addresses: (v) =>
        v.custom(async (i) => {
          await runMany(i, validators.IAddressValidator, isPartial);
        }),
    }, isPartial),

  IPersonInfoValidator: (person: IPersonInfo, isPartial:boolean=false) =>
    validateObject(person, {
      first_name: (v) => v.notEmpty(),
      last_name: (v) => v.notEmpty(),
      title: (v) => v.isIn(Object.values(PersonTitle)),
    }, isPartial),
};

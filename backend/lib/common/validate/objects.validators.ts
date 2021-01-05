import { array } from '../validate';
import { ValidationChain } from 'express-validator';
import {
  ErrCode,
  IAddress,
  Idless,
  PersonTitle,
  IHostMemberChangeRequest,
  IPerson,
  IPersonInfo,
  ISocialInfo,
} from '@eventi/interfaces';
import { FieldValidators as FV } from './fields.validators';

export namespace ObjectValidators {
  type ObjectValidator<T> = { [index in keyof T]: (v: ValidationChain) => ValidationChain };

  export const IAddress = (): ObjectValidator<Idless<IAddress>> => {
    return {
      city: v => FV.isString(v, ErrCode.INVALID),
      iso_country_code: v => FV.ISOCountry(v),
      postcode: v => FV.postcode(v),
      street_name: v => FV.isString(v, ErrCode.INVALID),
      street_number: v => FV.isInt(v, ErrCode.INVALID),
    };
  };

  export const IPersonInfo = (): ObjectValidator<IPersonInfo> => {
    return {
      title: v => FV.isString(v).isIn(Object.values(PersonTitle)),
      first_name: v => FV.isString(v),
      last_name: v => FV.isString(v),
    };
  };

  export const IPerson = (): ObjectValidator<Idless<IPerson>> => {
    return {
      ...IPersonInfo(),
      mobile_number: v => v.isMobilePhone('en-GB'),
      landline_number: v => v.isMobilePhone('en-GB'),
      addresses: v => v.custom(array(IAddress())),
    };
  };

  export const ISocialInfo = (): ObjectValidator<ISocialInfo> => {
    return {
      linkedin_url: v =>
        FV.isString(v)
          .isURL({ host_whitelist: ['linkedin.com'] })
          .withMessage(ErrCode.NOT_URL),
      facebook_url: v =>
        FV.isString(v)
          .isURL({ host_whitelist: ['facebook.com'] })
          .withMessage(ErrCode.NOT_URL),
      instagram_url: v =>
        FV.isString(v)
          .isURL({ host_whitelist: ['instagram.com'] })
          .withMessage(ErrCode.NOT_URL),
    };
  };

  export const IHostMemberChangeRequest = (
    value: IHostMemberChangeRequest['value'] = null
  ): ObjectValidator<IHostMemberChangeRequest> => {
    return {
      user_id: v => FV.isInt(v),
      change: v => FV.isString(v).isIn(['add', 'update', 'del']),
      value: v => v.optional(value == null ? true : false).equals(value.toString()),
    };
  };
}

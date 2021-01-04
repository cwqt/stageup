import { ErrCode } from '@eventi/interfaces';
import { ValidationChain } from 'express-validator';

export namespace FieldValidators {
  type CustomValidator = (v: ValidationChain, message?: ErrCode) => ValidationChain;

  export const password: CustomValidator = v => {
    return isString(v).isLength({ min: 6, max: 32 });
  };

  export const exists: CustomValidator = v => {
    return v.exists().withMessage(ErrCode.MISSING_FIELD);
  };

  export const isString: CustomValidator = (v, msg = ErrCode.INVALID) => {
    return exists(v).trim().notEmpty().isString().withMessage(msg);
  };

  export const email: CustomValidator = v => {
    return isString(v).isEmail().withMessage(ErrCode.INVALID_EMAIL).normalizeEmail();
  };

  export const postcode: CustomValidator = v => {
    return isString(v)
      .isPostalCode('GB') //TODO: make open to all counties
      .withMessage(ErrCode.REGEX_MATCH);
  };

  export const ISOCountry: CustomValidator = v => {
    return isString(v).isISO31661Alpha3().withMessage('Not a valid ISO country code');
  };

  export const isInt: CustomValidator = (v, msg) => {
    return exists(v)
      .isNumeric()
      .withMessage(msg || ErrCode.REGEX_MATCH);
  };
}

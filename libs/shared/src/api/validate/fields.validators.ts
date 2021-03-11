import { CurrencyCode, ErrCode } from '@core/interfaces';
import { enumToValues } from '@core/shared/helpers';
import { ValidationChain } from 'express-validator';

const FORBIDDEN_USERNAMES: string[] = [];
const CURRENCY_CODES = enumToValues(CurrencyCode);

export namespace FieldValidators {
  type CustomValidator = (v: ValidationChain, message?: ErrCode) => ValidationChain;

  export const password: CustomValidator = v => {
    return isString(v).isLength({ min: 6, max: 32 });
  };

  export const exists: CustomValidator = v => {
    return v.exists({ checkNull: false }).withMessage(ErrCode.MISSING_FIELD);
  };

  export const isString: CustomValidator = (v, message = ErrCode.INVALID) => {
    return exists(v).trim().notEmpty().isString().withMessage(message);
  };

  export const email: CustomValidator = v => {
    return isString(v).isEmail().withMessage(ErrCode.INVALID_EMAIL).normalizeEmail();
  };

  export const isInt: CustomValidator = (v, message) => {
    return exists(v)
      .isNumeric()
      .withMessage(message || ErrCode.REGEX_MATCH);
  };
  
  /**
   * @description 10 byte unix timestamp
   */
  export const timestamp: CustomValidator = v => {
    return isInt(v).isLength({ min: 10, max: 10 })
  }

  export const name: CustomValidator = v => {
    return isString(v)
      .isLength({ min: 6 })
      .withMessage(ErrCode.TOO_SHORT)
      .isLength({ max: 32 })
      .withMessage(ErrCode.TOO_LONG);
  };

  export const username: CustomValidator = v => {
    return isString(v)
      .isLength({ min: 6 })
      .withMessage(ErrCode.TOO_SHORT)
      .isLength({ max: 32 })
      .withMessage(ErrCode.TOO_LONG)
      .matches(/^[a-zA-Z\d]*$/)
      .withMessage(ErrCode.INVALID)
      .not()
      .isIn(FORBIDDEN_USERNAMES)
      .withMessage(ErrCode.FORBIDDEN);
  };

  export const postcode: CustomValidator = v => {
    return isString(v)
      .isPostalCode('GB') // TODO: make open to all counties
      .withMessage(ErrCode.REGEX_MATCH);
  };

  export const ISOCountry: CustomValidator = v => {
    return isString(v).isISO31661Alpha3().withMessage(ErrCode.REGEX_MATCH);
  };

  export const CurrencyCode:CustomValidator = v => {
    return v.isIn(CURRENCY_CODES)
  }
}

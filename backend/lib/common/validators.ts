import { IAddress, Idless, IHostMemberChangeRequest, IPerson, PersonTitle } from "@eventi/interfaces";
import { ValidationChain } from "express-validator";
import { array, single, object } from "./validate";

type CustomValidator = (v:ValidationChain, message?:string) => ValidationChain;

const FieldValidators:{[index:string]:CustomValidator} = {
  password: v => {
    return FieldValidators.IsString(v).isLength({ min: 6, max: 32 });
  },

  isString: (v, msg="Must be a string") => {
    return v
      .trim()
      .notEmpty()
      .isString()
      .withMessage(msg);
  },

  email: (v, msg) => {
    return FieldValidators.IsString(v)
      .withMessage('Must provide an e-mail address')
      .isEmail()
      .withMessage('Not a valid e-mail address')
      .normalizeEmail();
  },
  
  postcode: v => {
    return v.trim()
      .notEmpty()
      .withMessage('Must provide postcode')
      .isString()
      .isPostalCode('GB') //TODO: make open to all counties
      .withMessage('Not a valid postcode');
  },
  
  ISOCountry: v => {
    return v.trim()
      .notEmpty()
      .withMessage('Must provide ISO country code')
      .isString()
      .isISO31661Alpha3()
      .withMessage('Not a valid ISO country code');
  },
  
  isInt: (v, msg) => {
    return v.notEmpty().isNumeric().withMessage(msg);
  },  
}

type ObjectValidator<T> = {[index in keyof T]:CustomValidator};

const ObjectValidators = {
  IAddress: ():ObjectValidator<Idless<IAddress>> => {
    return {
      city: v => FieldValidators.isString(v, "Must provide a city"),
      iso_country_code: v => FieldValidators.ISOCountry(v),
      postcode: v => FieldValidators.Postcode(v),
      street_name: v => FieldValidators.isString(v, "Must provide a street name"),
      street_number: v => FieldValidators.isInt(v, "Must provide a street number")
    }
  },
  IPerson: ():ObjectValidator<Idless<IPerson>> => {
    return {
      title: v => FieldValidators.isString(v).isIn(Object.values(PersonTitle)),
      first_name: v => FieldValidators.isString(v),
      last_name: v => FieldValidators.isString(v),
      mobile_number: v => v.isMobilePhone("en-GB"),
      landline_number: v => v.isMobilePhone("en-GB"),
      addresses: v => v.custom(array(ObjectValidators.IAddress()))
    }
  },
  IHostMemberChangeRequest: (value:IHostMemberChangeRequest["value"]=null):ObjectValidator<IHostMemberChangeRequest> => {
    return {
      user_id: v => FieldValidators.isInt(v),
      change: v => FieldValidators.isString(v).isIn(['add', 'update', 'del']),
      value: v => v.optional(value == null ? true : false).equals(value.toString())
    }
  }
}

export default {
  Fields: FieldValidators,
  Objects: ObjectValidators
};
